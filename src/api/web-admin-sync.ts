// API service for syncing with Web Admin Panel

const DEFAULT_API_URL = 'http://localhost:3000';

interface SyncResponse {
  success: boolean;
  message?: string;
  data?: any;
}

class WebAdminAPI {
  private apiUrl: string;

  constructor(apiUrl: string = DEFAULT_API_URL) {
    this.apiUrl = apiUrl;
  }

  setApiUrl(url: string) {
    this.apiUrl = url;
  }

  getApiUrl() {
    return this.apiUrl;
  }

  // Sync users to web admin panel
  async syncUsers(users: any[]): Promise<SyncResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/api/sync/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ users }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error syncing users:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Sync service tickets to web admin panel
  async syncTickets(tickets: any[]): Promise<SyncResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/api/sync/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tickets }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error syncing tickets:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get users from web admin panel
  async fetchUsers(): Promise<SyncResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/api/sync/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching users:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Test connection to web admin panel
  async testConnection(): Promise<SyncResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/api/health`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return { success: true, message: 'Connection successful' };
    } catch (error) {
      console.error('Error testing connection:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  // Sync all data (users and tickets)
  async syncAll(users: any[], tickets: any[]): Promise<SyncResponse> {
    try {
      const usersResult = await this.syncUsers(users);
      if (!usersResult.success) {
        return usersResult;
      }

      const ticketsResult = await this.syncTickets(tickets);
      if (!ticketsResult.success) {
        return ticketsResult;
      }

      return { success: true, message: 'All data synced successfully' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Sync failed',
      };
    }
  }
}

// Singleton instance
const webAdminAPI = new WebAdminAPI();

export default webAdminAPI;
