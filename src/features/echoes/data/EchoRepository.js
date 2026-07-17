export class EchoRepository {
  async listForCurrentUser() {
    throw new Error('EchoRepository.listForCurrentUser must be implemented.');
  }

  async createEcho() {
    throw new Error('EchoRepository.createEcho must be implemented.');
  }

  async addPhotosToEcho() {
    throw new Error('EchoRepository.addPhotosToEcho must be implemented.');
  }

  async deleteEcho() {
    throw new Error('EchoRepository.deleteEcho must be implemented.');
  }
}
