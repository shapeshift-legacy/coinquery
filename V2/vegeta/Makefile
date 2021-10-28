.PHONY: check attack

check:
	@[ "${HOST}" ] || ( echo ">> HOST flag not set, see README.md for usage"; exit 1 )

attack: check
	@echo "running $(HOST) api load attack..."
	@vegeta attack \
		  -duration=60s \
		  -rate=500 \
		  -targets=./$(HOST)/targets.txt \
		  -output=results.bin

	@echo "api load test completed, printing reports"
	@vegeta report results.bin
	@echo "_____________________________________"
	@vegeta report -type="hist[0,2ms,4ms,6ms]" results.bin
