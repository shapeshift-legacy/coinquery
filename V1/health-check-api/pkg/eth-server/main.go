package healthcheck

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/mux"
)

type ProxyStatus struct {
	Result bool `json:"result"`
}

func StartServer() {
	var router = mux.NewRouter()

	router.HandleFunc("/healthcheck", healthCheck).Methods("GET")

	fmt.Println("Running server!")
	fmt.Println(http.ListenAndServe(":3000", router))
}

func getProxySyncing() bool {
	url := fmt.Sprintf("%s/api?module=proxy&action=eth_syncing&apikey=20",
		os.Getenv("PROXY_HOST_N_PORT"))

	proxyClient := http.Client{
		Timeout: time.Second * 4, // Maximum of 4 secs
	}

	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		fmt.Println(err)
		return true
	}

	res, getErr := proxyClient.Do(req)
	if getErr != nil {
		fmt.Println(getErr)
		return true
	}

	body, readErr := ioutil.ReadAll(res.Body)
	if readErr != nil {
		fmt.Println(readErr)
		return true
	}

	proxyStatus := ProxyStatus{}
	jsonErr := json.Unmarshal(body, &proxyStatus)
	if jsonErr != nil {
		fmt.Println(jsonErr)
		return true
	}
	return proxyStatus.Result
}

func healthCheck(w http.ResponseWriter, r *http.Request) {
	proxySyncing := getProxySyncing()
	if proxySyncing {
		http.Error(
			w,
			fmt.Sprintf("NOT SYNCED!"),
			http.StatusAccepted)
		return
	}
	json.NewEncoder(w).Encode("SYNCED!")
}
