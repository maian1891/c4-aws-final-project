import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';
const AWSXRay = require('aws-xray-sdk');

const XAWS = AWSXRay.captureAWS(AWS)
const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic
export class TodosAccess {
    constructor(
        private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly todosTable = process.env.TODOS_TABLE,
        private readonly todosByUserIndex = process.env.CREATED_AT_INDEX,
        private readonly bucketName = process.env.ATTACHMENT_S3_BUCKET) {
    }

    async getTodo(userId: string, todoId: string): Promise<TodoItem> {
        logger.info(`getting Todo item ${todoId}`)

        const params = {
            TableName: this.todosTable,
            Key: {
                userId,
                todoId
            }
        };

        const result = await this.docClient.get(params).promise()
        const item = result.Item
        if (item == undefined) {
            logger.error(`item id ${todoId} not found!`)
            return undefined
        }

        logger.info(`received todo ${JSON.stringify(item)}`)

        return item as TodoItem
    }

    async getAllTodosForUser(userId: string): Promise<TodoItem[]> {
        logger.info(`getting all Todos item for user ${userId}`)
        var getAllTodosParams = {
            TableName: this.todosTable,
            IndexName: this.todosByUserIndex,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }

        logger.info(`starting query with params ${JSON.stringify(getAllTodosParams)}`)

        const result = await this.docClient.query(getAllTodosParams).promise()
        const items = result.Items
        logger.info(`query returned ${items.length} results`)

        return items as TodoItem[]
    }

    async createToDo(todoItem: TodoItem): Promise<TodoItem> {
        logger.info(`creating Todo item ${todoItem}`)
        const params = {
            TableName: this.todosTable,
            Item: todoItem,
        }
        logger.info(`create Todo item with param ${params}`)
        await this.docClient.put(params).promise()
        return todoItem as TodoItem
    }

    async updateToDo(todoUpdate: TodoUpdate, todoId: string, userId: string): Promise<void> {
        logger.info(`updating Todo item ${todoId}`)

        const params = {
            TableName: this.todosTable,
            Key: {
                userId,
                todoId
            },
            UpdateExpression: "set #name = :name, #dueDate = :dueDate, #done = :done",
            ExpressionAttributeNames: {
                "#name": "name",
                "#dueDate": "dueDate",
                "#done": "done"
            },
            ExpressionAttributeValues: {
                ":name": todoUpdate['name'],
                ":dueDate": todoUpdate['dueDate'],
                ":done": todoUpdate['done']
            },
            ReturnValues: "UPDATED_NEW"
        }

        await this.docClient.update(params).promise();
        logger.info(`Todo item ${todoId} was updated!`)
    }

    async deleteToDo(todoId: string, userId: string): Promise<void> {
        logger.info(`deleting Todo item ${todoId} for user ${userId}`)
        const params = {
            TableName: this.todosTable,
            Key: {
                userId,
                todoId
            },
        }

        logger.info(`delete params: ${JSON.stringify(params)}`)

        await this.docClient.delete(params).promise()
    }

    async updateAttachmentURL(todoId: string, userId: string) {
        logger.info(`adding Attachment URL with userId ${userId} to Todo ${todoId}`)
        const attachmentUrl = `https://${this.bucketName}.s3.amazonaws.com/${todoId}`;
        const updateParams = {
            TableName: this.todosTable,
            Key: {
                userId: userId,
                todoId: todoId
            },
            UpdateExpression: 'set attachmentUrl = :attachmentUrl',
            ExpressionAttributeValues: {
                ':attachmentUrl': attachmentUrl
            },
            ReturnValues: "UPDATED_NEW"
        }
        await this.docClient.update(updateParams).promise()

        logger.info(`Attachment URL ${attachmentUrl} was added to Todo ${todoId}`)
    }
}