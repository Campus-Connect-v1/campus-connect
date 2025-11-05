import { api } from './authServices';

export interface StudyGroup {
  group_id: string;
  university_id: string;
  group_name: string;
  description?: string;
  course_code?: string;
  course_name?: string;
  group_type: 'public' | 'private' | 'invite_only';
  max_members: number;
  member_count: number;
  meeting_frequency?: string;
  preferred_location_type?: string;
  created_by: string;
  first_name?: string;
  last_name?: string;
  university_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  role?: string;
}

export interface CreateStudyGroupData {
  university_id: string;
  group_name: string;
  description?: string;
  course_code?: string;
  course_name?: string;
  group_type?: 'public' | 'private' | 'invite_only';
  max_members?: number;
}

export interface UpdateStudyGroupData {
  group_name?: string;
  description?: string;
  course_code?: string;
  course_name?: string;
  group_type?: 'public' | 'private' | 'invite_only';
  max_members?: number;
}

export interface StudyGroupFilters {
  university_id?: string;
  course_code?: string;
  group_type?: 'public' | 'private' | 'invite_only';
  page?: number;
  limit?: number;
}

export interface GroupMember {
  group_member_id: string;
  group_id: string;
  user_id: string;
  role: 'creator' | 'admin' | 'member';
  first_name: string;
  last_name: string;
  profile_picture_url?: string;
  program?: string;
  joined_at: string;
}

export const studyGroupApi = {
  // Get all study groups with filtering
  async getAllStudyGroups(filters?: StudyGroupFilters) {
    try {
      const response = await api.get('/study-group', { params: filters });
      return { success: true, data: response.data.data, count: response.data.count };
    } catch (error: any) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Get user's study groups
  async getUserStudyGroups() {
    try {
      const response = await api.get('/study-group/user');
      return { success: true, data: response.data.data, count: response.data.count };
    } catch (error: any) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Create new study group
  async createStudyGroup(data: CreateStudyGroupData) {
    try {
      const response = await api.post('/study-group', data);
      return { success: true, data: response.data.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Get study group by ID
  async getStudyGroupById(groupId: string) {
    try {
      const response = await api.get(`/study-group/${groupId}`);
      return { success: true, data: response.data.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Update study group
  async updateStudyGroup(groupId: string, data: UpdateStudyGroupData) {
    try {
      const response = await api.put(`/study-group/${groupId}`, data);
      return { success: true, data: response.data.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Join study group
  async joinStudyGroup(groupId: string) {
    try {
      const response = await api.post(`/study-group/${groupId}/join`);
      return { success: true, data: response.data.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Leave study group
  async leaveStudyGroup(groupId: string) {
    try {
      const response = await api.post(`/study-group/${groupId}/leave`);
      return { success: true, data: response.data.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Get group members
  async getGroupMembers(groupId: string) {
    try {
      const response = await api.get(`/study-group/${groupId}/members`);
      return { success: true, data: response.data.data, count: response.data.count };
    } catch (error: any) {
      return { success: false, error: error.response?.data || error.message };
    }
  },
};
