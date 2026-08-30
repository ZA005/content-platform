import type { CreateTaskInput, TaskRepository, UpdateTaskInput } from "@/core/interfaces/repositories";
import type { CreatorRepository } from "@/core/interfaces/repositories";
import type { ID, Task, TaskWithCreator } from "@/core/types";
import { repositoryFactory } from "@/infrastructure/repositories/repository-factory";

/**
 * Feature-level service: depends only on repository interfaces, so the
 * concrete localStorage repositories below can be swapped for API/Cloud
 * ones without any change to hooks or components that call this service.
 */
export class TaskService {
  private readonly taskRepository: TaskRepository;
  private readonly creatorRepository: CreatorRepository;

  constructor(taskRepository: TaskRepository, creatorRepository: CreatorRepository) {
    this.taskRepository = taskRepository;
    this.creatorRepository = creatorRepository;
  }

  private async attachCreators(tasks: Task[]): Promise<TaskWithCreator[]> {
    const creators = await this.creatorRepository.list();
    const byId = new Map(creators.map((c) => [c.id, c]));
    return tasks.map((task) => ({ ...task, creator: byId.get(task.creatorId) }));
  }

  async listAll(): Promise<TaskWithCreator[]> {
    return this.attachCreators(await this.taskRepository.list());
  }

  async listByDate(date: string): Promise<TaskWithCreator[]> {
    return this.attachCreators(await this.taskRepository.listByDate(date));
  }

  async listByCreator(creatorId: string): Promise<TaskWithCreator[]> {
    return this.attachCreators(await this.taskRepository.listByCreator(creatorId));
  }

  async create(input: CreateTaskInput): Promise<Task> {
    return this.taskRepository.create(input);
  }

  async update(id: ID, input: UpdateTaskInput): Promise<Task> {
    return this.taskRepository.update(id, input);
  }

  async delete(id: ID): Promise<void> {
    return this.taskRepository.delete(id);
  }
}

export const taskService = new TaskService(repositoryFactory.getTaskRepository(), repositoryFactory.getCreatorRepository());
