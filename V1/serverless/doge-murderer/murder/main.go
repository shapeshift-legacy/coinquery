package main

import (
	"fmt"
	"sort"
	"strings"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/ecs"
)

// Handler - main handler function for lambda
func Handler() {
	sess := session.Must(session.NewSession(&aws.Config{
		Region: aws.String("us-east-1"),
	}))
	svc := ecs.New(sess)
	input := &ecs.ListClustersInput{}

	result, err := svc.ListClusters(input)

	if err != nil {
		fmt.Println(err.Error())
		return
	}

	var dogeClusters []string

	for _, v := range result.ClusterArns {
		if strings.Contains(*v, "doge") &&
			strings.Contains(*v, "prod") &&
			!strings.Contains(*v, "Snapshot") {
			dogeClusters = append(dogeClusters, *v)
		}
	}

	for _, v := range dogeClusters {
		listTasksInput := &ecs.ListTasksInput{Cluster: &v}

		listTaskResult, err := svc.ListTasks(listTasksInput)

		if err != nil {
			fmt.Println(err.Error())
			continue
		}

		describeTaskInput := &ecs.DescribeTasksInput{
			Cluster: &v,
			Tasks:   listTaskResult.TaskArns,
		}

		describeTasksResult, err := svc.DescribeTasks(describeTaskInput)

		if err != nil {
			fmt.Println(err.Error())
			continue
		}

		sort.Slice(describeTasksResult.Tasks, func(i, j int) bool {
			return describeTasksResult.Tasks[i].CreatedAt.Before(*describeTasksResult.Tasks[j].CreatedAt)
		})

		reason := "Doge Murderer!"

		stopTaskInput := &ecs.StopTaskInput{
			Cluster: &v,
			Reason:  &reason,
			Task:    describeTasksResult.Tasks[0].TaskArn,
		}

		_, err = svc.StopTask(stopTaskInput)

		if err != nil {
			fmt.Println(err.Error())
			continue
		}
	}
}

func main() {
	lambda.Start(Handler)
}
