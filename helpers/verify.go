package helpers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"strings"
)

var errNoValidSignatures = errors.New("invalid webhook signature")

var errMalformedHeader = errors.New("X-PagerDuty-Signature header is either missing or malformed")

var errMalformedBody = errors.New("HTTP request body is either empty or malformed")

var errNoSecret = errors.New("webhook secret is not configured")

const (
	webhookSignaturePrefix = "v1="
	webhookSignatureHeader = "x-pagerduty-signature"
)

func VerifySignature(headers map[string]string, body, secret string) error {
	if secret == "" {
		return errNoSecret
	}

	if body == "" {
		return errMalformedBody
	}

	sigHeader, ok := headers[webhookSignatureHeader]
	if !ok {
		return errMalformedHeader
	}

	sigs := extractPayloadSignatures(sigHeader)
	if len(sigs) == 0 {
		return errMalformedHeader
	}

	s := calculateSignature(body, secret)

	for _, sig := range sigs {
		if hmac.Equal(s, sig) {
			return nil
		}
	}

	return errNoValidSignatures
}

func extractPayloadSignatures(s string) [][]byte {
	var sigs [][]byte

	for _, sv := range strings.Split(s, ",") {
		// Ignore any signatures that are not the initial v1 version.
		if !strings.HasPrefix(sv, webhookSignaturePrefix) {
			continue
		}

		sig, err := hex.DecodeString(strings.TrimPrefix(sv, webhookSignaturePrefix))
		if err != nil {
			continue
		}

		sigs = append(sigs, sig)
	}

	return sigs
}

func calculateSignature(body, secret string) []byte {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(body))
	return mac.Sum(nil)
}
