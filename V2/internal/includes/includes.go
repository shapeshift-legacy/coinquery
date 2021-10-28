package includes

// String returns true if the string set includes any elements
func String(ss []string, es ...string) bool {
	for _, e := range es {
		for _, s := range ss {
			if e == s {
				return true
			}
		}
	}

	return false
}
