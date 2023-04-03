import { TodosAccess } from './todosAcess'
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { TodoUpdate } from '../models/TodoUpdate';
import { createLogger } from '../utils/logger'
import { AttachmentUtils } from './attachmentUtils';

// TODO: Implement businessLogic
const uuidv4 = require('uuid/v4')
const toDoAccess = new TodosAccess()
const attachmentUtils = new AttachmentUtils()
const logger = createLogger('Todos business logic')

export async function getAllTodosForUser(userId: string): Promise<TodoItem[]> {
    logger.info(`getting Todos for user ${userId}`)
    return toDoAccess.getAllTodosForUser(userId)
}

export async function createToDo(createTodoRequest: CreateTodoRequest, userId: string): Promise<TodoItem> {
    logger.info(`creating new Todo for user: ${userId} with content ${JSON.stringify(createTodoRequest)}`)
    const todoId =  uuidv4()
    
    return toDoAccess.createToDo({
        userId: userId,
        todoId: todoId,
        createdAt: new Date().toISOString(),
        done: false,
        ...createTodoRequest,
    });
}

export function updateToDo(updateTodoRequest: UpdateTodoRequest, todoId: string, userId: string): Promise<void> {
    logger.info(`updating Todo item ${todoId} for user: ${userId} with content ${JSON.stringify(updateTodoRequest)}`)
    return toDoAccess.updateToDo(updateTodoRequest as TodoUpdate, todoId, userId)
}

export function deleteToDo(todoId: string, userId: string): Promise<void> {
    logger.info(`deleting Todo item ${todoId}`)
    return toDoAccess.deleteToDo(todoId, userId)
}

export async function createAttachmentPresignedUrl(todoId: string, userId: string): Promise<string> {
    logger.info(`getting upload URL for todo ${todoId}`)

    const url: string = await attachmentUtils.getUploadURL(todoId)
    logger.info(`presigned url generated: ${url}`)
    toDoAccess.updateAttachmentURL(todoId, userId)

    return url
}