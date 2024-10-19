package api

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/megakuul/conditional-access-automator/server/engine"
)

type formatRequest struct {
	Template string `json:"template"`
	Format string `json:"format"`
}

type formatResponse struct {
	Template string `json:"template"`
}

func (h* ApiHandler) format(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
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

	formatTmpl, err := engine.SerializeTemplate(tmpl, req.Format, h.emergencyAccount)
	if err!=nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Header().Add("Content-Type", "text/plain")
		w.Write([]byte(fmt.Sprintf("failed to serialize template: %v", err)))
		return
	}

	baseFormatTmpl := make([]byte, base64.URLEncoding.EncodedLen(len(formatTmpl)))
	base64.URLEncoding.Encode(baseFormatTmpl, formatTmpl)
	
	res := formatResponse{
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
