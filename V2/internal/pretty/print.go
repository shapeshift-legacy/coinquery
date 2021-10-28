package pretty

import (
	"encoding/json"
)

// Print returns a prettified json string of the thing you pass it
// or a returns "could not parse parameter" if an error happened!
func Print(s interface{}) string {
	pretty, err := json.MarshalIndent(s, "", "    ")
	if err != nil {
		return "Could not parse parameter"
	}
	return string(pretty)
}
