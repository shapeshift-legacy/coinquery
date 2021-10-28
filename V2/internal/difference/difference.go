package difference

// String takes 2 slices of strings and returns a slice containing the difference between the two
func String(a, b []string) []string {
	var short []string
	var long []string

	if len(a) < len(b) {
		short = a
		long = b
	} else {
		short = b
		long = a
	}

	mshort := map[string]bool{}
	for _, x := range short {
		mshort[x] = true
	}

	diff := []string{}
	for _, x := range long {
		if _, ok := mshort[x]; !ok {
			diff = append(diff, x)
		}
	}

	return diff
}
