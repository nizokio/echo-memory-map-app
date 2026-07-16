export class AuthRepository {
  async getSession() {
    throw new Error('AuthRepository.getSession must be implemented.');
  }

  onAuthStateChange() {
    throw new Error('AuthRepository.onAuthStateChange must be implemented.');
  }

  async signOut() {
    throw new Error('AuthRepository.signOut must be implemented.');
  }
}
