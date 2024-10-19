package api

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"github.com/megakuul/conditional-access-automator/server/engine"
)

type applyRequest struct {
	Template string `json:"template"`
}

type applyResponse struct {
	Template string `json:"template"`
}

func (h* ApiHandler) apply(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	accessTokenCookie, err := r.Cookie("access_token")
	if err!=nil {
		w.WriteHeader(http.StatusForbidden)
		return
	}
	
	reqRaw, err := io.ReadAll(r.Body)
	if err!=nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Header().Add("Content-Type", "text/plain")
		w.Write([]byte("failed to read request body"))
		return
	}
	req := formatRequest{}
	err = json.Unmarshal(reqRaw, &req)
	if err!=nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Header().Add("Content-Type", "text/plain")
		w.Write([]byte("invalid request format"))
		return
	}

	jsonTmpl := make([]byte, base64.URLEncoding.DecodedLen(len(req.Template)))
	_, err = base64.URLEncoding.Decode(jsonTmpl, []byte(req.Template))
	if err!=nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Header().Add("Content-Type", "text/plain")
		w.Write([]byte("cannot base64 decode the template body"))
		return
	}

	tmpl, err := engine.ParseTemplate(jsonTmpl)
	if err!=nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Header().Add("Content-Type", "text/plain")
		w.Write([]byte(fmt.Sprintf("failed to parse template: %v", err)))
		return
	}

	azureTmplId, azureTmpl, err := engine.SerializeAzureTemplate(tmpl, h.emergencyAccount)
	if err!=nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Header().Add("Content-Type", "text/plain")
		w.Write([]byte(fmt.Sprintf("failed to serialize template: %v", err)))
		return
	}
	
	policy, err := h.adapter.UpdatePolicy(accessTokenCookie.Value, azureTmplId, azureTmpl)
	if err!=nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Header().Add("Content-Type", "text/plain")
		w.Write([]byte(fmt.Sprintf("failed to update policy: %v", err)))
		return
	}

	tmpl, err = engine.ParseAzureTemplate(policy)
	if err!=nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Header().Add("Content-Type", "text/plain")
		w.Write([]byte(fmt.Sprintf("failed to parse output template: %v", err)))
		return
	}

	jsonTmpl, err = engine.SerializeTemplate(tmpl, "json", h.emergencyAccount)
	if err!=nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Header().Add("Content-Type", "text/plain")
		w.Write([]byte(fmt.Sprintf("failed to serialize output template: %v", err)))
		return
	}

	baseFormatTmpl := make([]byte, base64.URLEncoding.EncodedLen(len(jsonTmpl)))
	base64.URLEncoding.Encode(baseFormatTmpl, jsonTmpl)

	res := applyResponse{
		Template: string(baseFormatTmpl),
	}
	resRaw, err := json.Marshal(res)
	if err!=nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Header().Add("Content-Type", "text/plain")
		w.Write([]byte(fmt.Sprintf("failed to serialize response")))
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Header().Add("Content-Type", "application/json")
	w.Write(resRaw)
}
