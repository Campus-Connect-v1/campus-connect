// Mock data for messaging interface - matches API response structure
// Replace with real API calls by updating messagesApi.ts

export const mockConversations = [
  {
    id: "conv-1",
    participants: [
      {
        id: "user-2",
        first_name: "Alex",
        last_name: "Chen",
        profile_picture_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
        profile_headline: "CS Major | Web Dev Enthusiast",
        program: "Computer Science",
        year_of_study: "3rd Year",
      },
    ],
    lastMessage: "Hey! Did you finish the assignment?",
    lastMessageTime: new Date(Date.now() - 5 * 60000), // 5 mins ago
    unreadCount: 2,
    isOnline: true,
  },
  {
    id: "conv-2",
    participants: [
      {
        id: "user-3",
        first_name: "Jordan",
        last_name: "Williams",
        profile_picture_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
        profile_headline: "Business Major | Startup Founder",
        program: "Business Administration",
        year_of_study: "2nd Year",
      },
    ],
    lastMessage: "Let's grab coffee tomorrow?",
    lastMessageTime: new Date(Date.now() - 2 * 3600000), // 2 hours ago
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: "conv-3",
    participants: [
      {
        id: "user-4",
        first_name: "Sam",
        last_name: "Patel",
        profile_picture_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
        profile_headline: "Engineering Major | Robotics Club Lead",
        program: "Mechanical Engineering",
        year_of_study: "4th Year",
      },
    ],
    lastMessage: "Check out the new robotics project!",
    lastMessageTime: new Date(Date.now() - 24 * 3600000), // 1 day ago
    unreadCount: 0,
    isOnline: true,
  },
  {
    id: "conv-4",
    participants: [
      {
        id: "user-5",
        first_name: "Taylor",
        last_name: "Martinez",
        profile_picture_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
        profile_headline: "Psychology Major | Mental Health Advocate",
        program: "Psychology",
        year_of_study: "3rd Year",
      },
    ],
    lastMessage: "Thanks for the study notes!",
    lastMessageTime: new Date(Date.now() - 3 * 24 * 3600000), // 3 days ago
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: "conv-5",
    participants: [
      {
        id: "user-6",
        first_name: "Casey",
        last_name: "Johnson",
        profile_picture_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
        profile_headline: "Art & Design | Creative Director",
        program: "Fine Arts",
        year_of_study: "2nd Year",
      },
    ],
    lastMessage: "Love your design work! 🎨",
    lastMessageTime: new Date(Date.now() - 5 * 24 * 3600000), // 5 days ago
    unreadCount: 1,
    isOnline: true,
  },
]

export const mockMessages = {
  "conv-1": [
    {
      id: "msg-1",
      senderId: "user-2",
      senderName: "Alex Chen",
      senderAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
      content: "Hey! How's it going?",
      timestamp: new Date(Date.now() - 30 * 60000),
      isCurrentUser: false,
    },
    {
      id: "msg-2",
      senderId: "current-user",
      senderName: "You",
      senderAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
      content: "Pretty good! Just finished studying for the midterm.",
      timestamp: new Date(Date.now() - 25 * 60000),
      isCurrentUser: true,
    },
    {
      id: "msg-3",
      senderId: "user-2",
      senderName: "Alex Chen",
      senderAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
      content: "Nice! Did you finish the assignment?",
      timestamp: new Date(Date.now() - 5 * 60000),
      isCurrentUser: false,
    },
    {
      id: "msg-4",
      senderId: "user-2",
      senderName: "Alex Chen",
      senderAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
      content: "The one due tomorrow?",
      timestamp: new Date(Date.now() - 4 * 60000),
      isCurrentUser: false,
    },
  ],
  "conv-2": [
    {
      id: "msg-5",
      senderId: "user-3",
      senderName: "Jordan Williams",
      senderAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
      content: "Hey! How have you been?",
      timestamp: new Date(Date.now() - 3 * 3600000),
      isCurrentUser: false,
    },
    {
      id: "msg-6",
      senderId: "current-user",
      senderName: "You",
      senderAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
      content: "Good! Been busy with classes.",
      timestamp: new Date(Date.now() - 2.5 * 3600000),
      isCurrentUser: true,
    },
    {
      id: "msg-7",
      senderId: "user-3",
      senderName: "Jordan Williams",
      senderAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
      content: "Let's grab coffee tomorrow?",
      timestamp: new Date(Date.now() - 2 * 3600000),
      isCurrentUser: false,
    },
  ],
  "conv-3": [
    {
      id: "msg-8",
      senderId: "user-4",
      senderName: "Sam Patel",
      senderAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
      content: "Check out the new robotics project!",
      timestamp: new Date(Date.now() - 24 * 3600000),
      isCurrentUser: false,
    },
    {
      id: "msg-9",
      senderId: "user-4",
      senderName: "Sam Patel",
      senderAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
      content: "We're building an autonomous drone 🚁",
      timestamp: new Date(Date.now() - 23.5 * 3600000),
      isCurrentUser: false,
    },
  ],
  "conv-4": [
    {
      id: "msg-10",
      senderId: "current-user",
      senderName: "You",
      senderAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
      content: "Hey Taylor! Can I get the notes from last lecture?",
      timestamp: new Date(Date.now() - 4 * 24 * 3600000),
      isCurrentUser: true,
    },
    {
      id: "msg-11",
      senderId: "user-5",
      senderName: "Taylor Martinez",
      senderAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
      content: "Of course! Sending them now.",
      timestamp: new Date(Date.now() - 3.8 * 24 * 3600000),
      isCurrentUser: false,
    },
    {
      id: "msg-12",
      senderId: "user-5",
      senderName: "Taylor Martinez",
      senderAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
      content: "Thanks for the study notes!",
      timestamp: new Date(Date.now() - 3 * 24 * 3600000),
      isCurrentUser: false,
    },
  ],
  "conv-5": [
    {
      id: "msg-13",
      senderId: "user-6",
      senderName: "Casey Johnson",
      senderAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
      content: "Love your design work! 🎨",
      timestamp: new Date(Date.now() - 5 * 24 * 3600000),
      isCurrentUser: false,
    },
    {
      id: "msg-14",
      senderId: "user-6",
      senderName: "Casey Johnson",
      senderAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
      content: "Want to collaborate on a project?",
      timestamp: new Date(Date.now() - 4.9 * 24 * 3600000),
      isCurrentUser: false,
    },
  ],
}

export const currentUser = {
  id: "current-user",
  first_name: "Jordan",
  last_name: "Smith",
  profile_picture_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
  profile_headline: "Computer Science Student | Tech Enthusiast",
  program: "Computer Science",
  year_of_study: "3rd Year",
  email: "jordan.smith@university.edu",
  phone_number: "+1 (555) 123-4567",
}
