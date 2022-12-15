.PHONY: build clean deploy deployprod

build:
	export GO111MODULE=on
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/extractTitle extractTitle/main.go

clean:
	rm -rf ./bin ./vendor

deploy: clean build
	serverless deploy -s dev --verbose

deployprod: clean build
	serverless deploy -s prod --verbose --param pagerDutyAPIKey=$(PD_API_KEY_PROD)
