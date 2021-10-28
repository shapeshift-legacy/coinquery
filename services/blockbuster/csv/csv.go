package csv

import (
	"encoding/csv"
	"os"

	"github.com/labstack/gommon/log"
)

// Generate takes a slice of slice of string and writes to csv file
func Generate(data [][]string) {
	csvData := [][]string{{"Transaction IDs", "Epoch", "Date", "Input", "Output", "Addresses"}}
	csvData = append(csvData, data...)

	file, err := os.Create("result.csv")
	checkError("Cannot create file", err)
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	for _, val := range csvData {
		err := writer.Write(val)
		checkError("Cannot write to file", err)
	}
}

func checkError(msg string, err error) {
	if err != nil {
		log.Fatal(msg, err)
	}
}
