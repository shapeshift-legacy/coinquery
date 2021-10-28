package retry

import (
	"math/rand"
	"time"
)

// Simple will attempt to retry the function if any errors are returned.
// A sleep (in seconds) will be added between retry attempts
func Simple(attempts int, sleep int64, fn func() error) error {
	if err := fn(); err != nil {
		if attempts--; attempts > 0 {
			time.Sleep(time.Duration(sleep) * time.Second)

			return Simple(attempts, sleep, fn)
		}

		return err
	}

	return nil
}

// Backoff will attempt to retry the function with jitter and backoff if any errors are returned
// A sleep that includes jitter (in seconds) will be added between retry attempts
func Backoff(attempts int, sleep int64, fn func() error) error {
	if err := fn(); err != nil {
		if attempts--; attempts > 0 {
			jitter := rand.Int63n(sleep) // add some randomness to prevent creating a Thundering Herd

			sleep = sleep + jitter/2

			time.Sleep(time.Duration(sleep) * time.Second)

			return Backoff(attempts, 2*sleep, fn) // double sleep for retry backoff
		}

		return err
	}

	return nil
}
