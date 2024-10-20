package api

import (
	"bytes"
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

func (h *ApiHandler) apply(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	accessTokenCookie, err := r.Cookie("access_token")
	if err != nil {
		w.WriteHeader(http.StatusForbidden)
		return
	}

	reqRaw, err := io.ReadAll(r.Body)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Header().Add("Content-Type", "text/plain")
		w.Write([]byte("failed to read request body"))
		return
	}
	req := applyRequest{}
	err = json.Unmarshal(reqRaw, &req)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Header().Add("Content-Type", "text/plain")
		w.Write([]byte("invalid request format"))
		return
	}

	jsonTmpl := make([]byte, base64.URLEncoding.DecodedLen(len(req.Template)))
	_, err = base64.URLEncoding.Decode(jsonTmpl, []byte(req.Template))
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Header().Add("Content-Type", "text/plain")
		w.Write([]byte("cannot base64 decode the template body"))
		return
	}
	jsonTmpl = bytes.ReplaceAll(jsonTmpl, []byte("\x00"), []byte(""))
	tmpl, err := engine.ParseTemplate(jsonTmpl)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Header().Add("Content-Type", "text/plain")
		w.Write([]byte(fmt.Sprintf("failed to parse template: %v", err)))
		return
	}

	azureTmplId, azureTmpl, err := engine.SerializeAzureTemplate(tmpl, h.emergencyAccount)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Header().Add("Content-Type", "text/plain")
		w.Write([]byte(fmt.Sprintf("failed to serialize template: %v", err)))
		return
	}

	err = h.adapter.UpdatePolicy(accessTokenCookie.Value, azureTmplId, azureTmpl)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Header().Add("Content-Type", "text/plain")
		w.Write([]byte(fmt.Sprintf("failed to update policy: %v", err)))
		return
	}

	w.WriteHeader(http.StatusOK)
}
