package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/signal"
	"strings"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
)

func main() {
	broker := os.Getenv("HIVE_MQTT_BROKER")
	if broker == "" {
		log.Fatal("HIVE_MQTT_BROKER not set")
	}
	username := os.Getenv("HIVE_MQTT_USERNAME")
	password := os.Getenv("HIVE_MQTT_PASSWORD")
	useWSS := strings.EqualFold(os.Getenv("HIVE_MQTT_USE_WSS"), "true")

	scheme := "tcp"
	if useWSS {
		scheme = "wss"
	}
	brokerURL := fmt.Sprintf("%s://%s", scheme, broker)

	topic := "zigbee2mqtt/#"
	if len(os.Args) > 1 {
		topic = os.Args[1]
	}

	opts := mqtt.NewClientOptions().
		AddBroker(brokerURL).
		SetClientID("saffron-hive-debug").
		SetAutoReconnect(true).
		SetConnectTimeout(10 * time.Second).
		SetKeepAlive(30 * time.Second)

	if username != "" {
		opts.SetUsername(username)
	}
	if password != "" {
		opts.SetPassword(password)
	}

	client := mqtt.NewClient(opts)
	token := client.Connect()
	token.Wait()
	if token.Error() != nil {
		log.Fatalf("connect: %v", token.Error())
	}
	fmt.Printf("connected to %s\n", brokerURL)
	fmt.Printf("subscribing to %s\n\n", topic)

	token = client.Subscribe(topic, 0, func(_ mqtt.Client, msg mqtt.Message) {
		payload := msg.Payload()
		var pretty string
		var js json.RawMessage
		if json.Unmarshal(payload, &js) == nil {
			b, _ := json.MarshalIndent(js, "  ", "  ")
			pretty = string(b)
		} else {
			pretty = string(payload)
		}
		fmt.Printf("[%s] %s\n  %s\n\n", time.Now().Format("15:04:05"), msg.Topic(), pretty)
	})
	token.Wait()
	if token.Error() != nil {
		log.Fatalf("subscribe: %v", token.Error())
	}

	sig := make(chan os.Signal, 1)
	signal.Notify(sig, os.Interrupt)
	<-sig
	fmt.Println("\ndisconnecting...")
	client.Disconnect(250)
}
