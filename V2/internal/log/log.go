package log

import (
	"fmt"
	"sync"

	"github.com/sirupsen/logrus"
)

var service string
var coin string
var customFields Fields
var rwm sync.RWMutex

// Fields is a map of annotations that can be added to a log message
type Fields map[string]interface{}

// Initialize sets up a logger with a specified service and coin that will be added to all logs
func Initialize(s string, c string) {
	logrus.SetFormatter(&logrus.JSONFormatter{
		TimestampFormat: "2006-01-02 15:04:05",
		PrettyPrint:     false,
	})

	// TODO: configurable log level to turn on debug logging in production
	logrus.SetLevel(logrus.InfoLevel)

	service = s
	coin = c
}

// Debug is a debug level log message
func Debug(pkg string, args ...interface{}) {
	fields := constructFields(pkg)
	logrus.WithFields(fields).Debug(args...)
	clearCustomFields()
}

// Debugf is a debug level formatted log message
func Debugf(pkg, format string, args ...interface{}) {
	fields := constructFields(pkg)
	logrus.WithFields(fields).Debugf(format, args...)
	clearCustomFields()
}

// Info is an info level log message
func Info(pkg string, args ...interface{}) {
	fields := constructFields(pkg)
	logrus.WithFields(fields).Info(args...)
	clearCustomFields()
}

// Infof is an info level formatted log message
func Infof(pkg, format string, args ...interface{}) {
	fields := constructFields(pkg)
	logrus.WithFields(fields).Infof(format, args...)
	clearCustomFields()
}

// Warn is a warn level error log message with optional annotation
func Warn(err error, pkg string, args ...interface{}) {
	fields := constructFields(pkg)
	msg := constructMessage(args...)
	logrus.WithFields(fields).Warnf("%s%+v", msg, err)
	clearCustomFields()
}

// Warnf is a warn level formatted error log message with optional annotation
func Warnf(err error, pkg, format string, args ...interface{}) {
	fields := constructFields(pkg)
	logrus.WithFields(fields).Warnf("%s: %+v", fmt.Sprintf(format, args...), err)
	clearCustomFields()
}

// Error is a error level error log message with optional annotation
func Error(err error, pkg string, args ...interface{}) {
	fields := constructFields(pkg)
	msg := constructMessage(args...)
	logrus.WithFields(fields).Errorf("%s%+v", msg, err)
	clearCustomFields()
}

// Errorf is a error level formatted error log message with optional annotation
func Errorf(err error, pkg, format string, args ...interface{}) {
	fields := constructFields(pkg)
	logrus.WithFields(fields).Errorf("%s: %+v", fmt.Sprintf(format, args...), err)
	clearCustomFields()
}

// Fatal is a fatal level error log message with optional annotation that calls os.Exit(1)
func Fatal(err error, pkg string, args ...interface{}) {
	fields := constructFields(pkg)
	msg := constructMessage(args...)
	logrus.WithFields(fields).Fatalf("%s%+v", msg, err)
	clearCustomFields()
}

// Fatalf is a fatal level formatted error log message with optional annotation that calls os.Exit(1)
func Fatalf(err error, pkg, format string, args ...interface{}) {
	fields := constructFields(pkg)
	logrus.WithFields(fields).Fatalf("%s: %+v", fmt.Sprintf(format, args...), err)
	clearCustomFields()
}

// Panic is a panic level error log message with optional annotation that calls panic()
func Panic(err error, pkg string, args ...interface{}) {
	fields := constructFields(pkg)
	msg := constructMessage(args...)
	logrus.WithFields(fields).Panicf("%s%+v", msg, err)
	clearCustomFields()
}

// Panicf is a panic level formatted error log message with optional annotation that calls panic()
func Panicf(err error, pkg, format string, args ...interface{}) {
	fields := constructFields(pkg)
	logrus.WithFields(fields).Panicf("%s: %+v", fmt.Sprintf(format, args...), err)
	clearCustomFields()
}

// SetCustomFields will populate customFields to be added to the default log fields (thread safe writes)
func SetCustomFields(f Fields) {
	rwm.Lock()
	defer rwm.Unlock()
	customFields = f
}

// clearCustomFields will clear the custom fields after each log (thread safe writes)
func clearCustomFields() {
	rwm.Lock()
	defer rwm.Unlock()
	customFields = nil
}

// constructFields will add custom fields to the default fields if they exist (thread safe reads)
func constructFields(pkg string) logrus.Fields {
	rwm.RLock()
	defer rwm.RUnlock()

	fields := logrus.Fields{
		"service": service,
		"coin":    coin,
		"package": pkg,
	}

	for k, v := range customFields {
		fields[k] = v
	}

	return fields
}

// constructMessage will add the annotation if supplied
func constructMessage(args ...interface{}) string {
	if len(args) == 0 {
		return ""
	}

	return fmt.Sprint(args...) + ": "
}
