package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type destroyRequest struct {
	TemplateId string `json:"template_id"`
}

func (h* ApiHandler) destroy(w http.ResponseWriter, r *http.Request) {
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
	req := destroyRequest{}
	err = json.Unmarshal(reqRaw, &req)
	if err!=nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Header().Add("Content-Type", "text/plain")
		w.Write([]byte("invalid request format"))
		return
	}
	
	err = h.adapter.DeletePolicy(accessTokenCookie.Value, req.TemplateId)
	if err!=nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Header().Add("Content-Type", "text/plain")
		w.Write([]byte(fmt.Sprintf("failed to delete policy: %v", err)))
		return
	}

	w.WriteHeader(http.StatusOK)
}
