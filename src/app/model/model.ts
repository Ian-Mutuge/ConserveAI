export interface Auth {
    token: string;
    userId: string;
    name: string;
    email: string;
    role?: string;
  }
  
  export interface User {
    email: string;
    password: string;
    name?: string;
  }
  