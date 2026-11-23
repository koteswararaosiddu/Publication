
function getUsers() {
    const rawUsers = process.env.AUTH_USERS_JSON;
  
    if (!rawUsers) {
      throw new Error('AUTH_USERS_JSON is not configured.');
    }
  
    const users = JSON.parse(rawUsers);
  
    if (!Array.isArray(users) || users.length !== 5) {
      throw new Error('Exactly five users must be configured.');
    }
  
    return users;
  }
  
  export async function validateUser(username, password) {
    if (
      typeof username !== 'string' ||
      typeof password !== 'string'
    ) {
      return false;
    }
  
    const users = getUsers();
  
    const user = users.find(
      item =>
        item.username?.trim().toLowerCase() ===
        username.trim().toLowerCase()
    );
  
    if (!user) return false;
  
    return user.passwordHash === password;
  }
  