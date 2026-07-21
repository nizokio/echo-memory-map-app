export class EchoRepository {
  async listForCurrentUser() {
    throw new Error('EchoRepository.listForCurrentUser must be implemented.');
  }

  async createEcho() {
    throw new Error('EchoRepository.createEcho must be implemented.');
  }

  async embedEcho() {
    throw new Error('EchoRepository.embedEcho must be implemented.');
  }

  async searchEchoes() {
    throw new Error('EchoRepository.searchEchoes must be implemented.');
  }

  async addPhotosToEcho() {
    throw new Error('EchoRepository.addPhotosToEcho must be implemented.');
  }

  async addAudioNoteToEcho() {
    throw new Error('EchoRepository.addAudioNoteToEcho must be implemented.');
  }

  async deleteEcho() {
    throw new Error('EchoRepository.deleteEcho must be implemented.');
  }
}
