package api

import (
	"fmt"
	"strconv"

	"github.com/pkg/errors"
)

// Pagination holds pagination info for insight endpoints
type Pagination struct {
	LimitClause  string
	OffsetClause string
	FromPage     int
	ToPage       int
}

func rangeErr(fromPage int, toPage int, max int) string {
	return fmt.Sprintf(
		"'from' (%d) and 'to' (%d) range should be less than or equal to %d",
		fromPage,
		toPage,
		max,
	)
}

func negativeErr(fromPage int, toPage int) string {
	return fmt.Sprintf(
		"Unexpected state: 'from' (%d) is expected to be less than 'to' (%d)",
		fromPage,
		toPage,
	)
}

// TraditionalPagintion creates a pagination struct to service insight api
func TraditionalPagintion(from string, to string, defaultLimit int, maxLimit int) (*Pagination, error) {
	fromPage, _ := strconv.Atoi(from)

	var toPage int
	if t, err := strconv.Atoi(to); err != nil {
		toPage = fromPage + defaultLimit
	} else {
		toPage = t
	}

	limitClause := fmt.Sprintf("LIMIT %d", defaultLimit)
	offsetClause := ""

	diff := 0
	if from != "" && to != "" {
		diff = toPage - fromPage

		if diff > maxLimit {
			return nil, errors.New(rangeErr(fromPage, toPage, maxLimit))
		} else if toPage == 0 && fromPage == 0 {
			fromPage, toPage, diff = 0, defaultLimit, defaultLimit
		} else if diff <= 0 {
			return nil, errors.New(negativeErr(fromPage, toPage))
		}

		limitClause = fmt.Sprintf("LIMIT %v", diff)
		offsetClause = fmt.Sprintf("OFFSET %v", fromPage)

	} else if from != "" {
		offsetClause = fmt.Sprintf("OFFSET %v", fromPage)
		toPage = fromPage + defaultLimit

	} else if to != "" {
		diff = toPage - fromPage

		if diff > maxLimit {
			return nil, errors.New(rangeErr(fromPage, toPage, maxLimit))
		}
		if toPage == 0 {
			toPage = defaultLimit
		}
		limitClause = fmt.Sprintf("LIMIT %v", toPage)
	}

	return &Pagination{
		limitClause,
		offsetClause,
		fromPage,
		toPage,
	}, nil
}
