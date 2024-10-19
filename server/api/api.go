package api

import (
	"net/http"

	"github.com/megakuul/conditional-access-automator/server/adapter"
)

type Api struct {
	server *http.Server
}

type ApiHandler struct {
	emergencyAccount string
	adapter *adapter.AzureAdapter
}

func NewApi(addr, emergencyAccount string) *Api {
	serveHandler := ApiHandler{
		emergencyAccount: emergencyAccount,
		adapter: &adapter.AzureAdapter{},
	}
	
	serveMux := http.NewServeMux()
	serveMux.HandleFunc("/list", serveHandler.list)
	serveMux.HandleFunc("/format", serveHandler.format)
	serveMux.HandleFunc("/apply", serveHandler.apply)
	
	return &Api{
		server: &http.Server{
			Addr: addr,
			Handler: serveMux,
		},
	}
}

func (a *Api) Serve() error {
	return a.server.ListenAndServe()
}
