import type { Community, Conversation, NotificationItem, Post, SettingGroup, Story, UserSummary } from '../types'

export const currentUser: UserSummary = {
  id: 'me',
  name: 'Ava Martinez',
  handle: '@avam',
  avatar:
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
  verified: true,
  followerCount: 24800,
}

export const stories: Story[] = [
  { id: 's1', name: 'You', avatar: currentUser.avatar, accent: '#7c3aed' },
  { id: 's2', name: 'Zoe', avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=200&q=80', accent: '#ec4899' },
  { id: 's3', name: 'Lena', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80', accent: '#f59e0b' },
  { id: 's4', name: 'Milo', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80', accent: '#10b981' },
  { id: 's5', name: 'Nia', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80', accent: '#3b82f6' },
]

export const posts: Post[] = [
  {
    id: 'p1',
    author: {
      id: 'u1',
      name: 'Maya Chen',
      handle: '@mayac',
      avatar:
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80',
      verified: true,
    },
    time: '12 min ago',
    content:
      'Morning walk, fresh air, and a new idea for our neighborhood clean-up challenge. Small actions create the biggest momentum. #CommunityCare',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    likes: 286,
    comments: 38,
    shares: 21,
    saved: 12,
    category: 'Wellbeing',
  },
  {
    id: 'p2',
    author: {
      id: 'u2',
      name: 'Noah Brooks',
      handle: '@noahb',
      avatar:
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
    },
    time: '48 min ago',
    content:
      'We turned a vacant lot into a tiny community garden this weekend. The best part was seeing families bring seedlings, stories, and support for one another.',
    likes: 932,
    comments: 77,
    shares: 63,
    saved: 44,
    category: 'Local Impact',
  },
  {
    id: 'p3',
    author: {
      id: 'u3',
      name: 'Sofia Patel',
      handle: '@sofiap',
      avatar:
        'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=200&q=80',
      verified: true,
    },
    time: '2 hours ago',
    content:
      'Planning a family-friendly art event for Saturday afternoon. We want to create a safe, welcoming, and creative space for all ages. Who should we invite?',
    likes: 415,
    comments: 52,
    shares: 30,
    saved: 22,
    category: 'Events',
  },
]

export const trendingTopics = [
  'Neighborhood care',
  'Parent circles',
  'Community gardens',
  'Family wellness',
  'Creative learning',
  'Local events',
]

export const recommendedUsers: UserSummary[] = [
  {
    id: 'ru1',
    name: 'Leah Scott',
    handle: '@leahscott',
    avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80',
    followerCount: 18800,
  },
  {
    id: 'ru2',
    name: 'Daniel Ortiz',
    handle: '@danielo',
    avatar: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=200&q=80',
    followerCount: 24900,
  },
  {
    id: 'ru3',
    name: 'Priya Shah',
    handle: '@priyashah',
    avatar: 'https://images.unsplash.com/photo-1549575815-3b7f8f1d8b49?auto=format&fit=crop&w=200&q=80',
    followerCount: 9100,
  },
]

export const communities: Community[] = [
  {
    id: 'c1',
    name: 'Parents in Motion',
    description: 'Supportive inspiration for modern family routines and purpose-driven parenting.',
    members: '18.2k members',
    category: 'Parenting',
    cover: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80',
    joined: true,
  },
  {
    id: 'c2',
    name: 'City Green Spaces',
    description: 'Connect with neighbors building cleaner, calmer, greener public spaces.',
    members: '9.8k members',
    category: 'Environment',
    cover: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80',
    joined: true,
  },
  {
    id: 'c3',
    name: 'Creative Families',
    description: 'Share crafts, activities, and local events that help kids and adults create together.',
    members: '12.4k members',
    category: 'Activities',
    cover: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=900&q=80',
  },
]

export const notifications: NotificationItem[] = [
  { id: 'n1', type: 'like', user: 'Maya', action: 'liked your “Community clean-up” post', time: '3 min ago', unread: true },
  { id: 'n2', type: 'comment', user: 'Daniel', action: 'commented on your post: “This is such a great idea.”', time: '18 min ago', unread: true },
  { id: 'n3', type: 'follow', user: 'Leah', action: 'started following you', time: '1 hour ago' },
  { id: 'n4', type: 'mention', user: 'NOVA Safety', action: 'mentioned you in a community discussion', time: '2 hours ago' },
  { id: 'n5', type: 'system', user: 'System', action: 'Your report was reviewed and the profile was restricted', time: 'Today', unread: true },
]

export const conversations: Conversation[] = [
  {
    id: 'm1',
    name: 'Alicia Green',
    handle: '@aliciag',
    avatar: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=200&q=80',
    lastMessage: 'Thanks for sharing the event details. We’re in.',
    time: '2m',
    unread: 2,
    online: true,
  },
  {
    id: 'm2',
    name: 'Marcus Lee',
    handle: '@marcusl',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    lastMessage: 'Can you send over the volunteer schedule?',
    time: '34m',
    unread: 0,
    online: true,
  },
  {
    id: 'm3',
    name: 'The Family Circle',
    handle: '@familycircle',
    avatar: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=200&q=80',
    lastMessage: 'Everyone agreed to host the workshop this weekend.',
    time: '1h',
    unread: 5,
  },
]

export const settingsGroups: SettingGroup[] = [
  {
    id: 'account',
    title: 'Account',
    items: [
      { label: 'Email', value: 'ava@nova.social' },
      { label: 'Phone', value: '+1 (415) 555-0147' },
      { label: 'Language', value: 'English (US)' },
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy',
    items: [
      { label: 'Profile visibility', value: 'Friends only' },
      { label: 'Message requests', value: 'Allow' },
      { label: 'Location sharing', value: 'Off' },
    ],
  },
  {
    id: 'security',
    title: 'Security',
    items: [
      { label: 'Two-factor auth', value: 'Enabled' },
      { label: 'Login alerts', value: 'On' },
      { label: 'Trusted devices', value: '3' },
    ],
  },
  {
    id: 'notifications',
    title: 'Notifications',
    items: [
      { label: 'Push updates', value: 'On' },
      { label: 'Daily summary', value: 'Weekly' },
      { label: 'Email digest', value: 'Preferred' },
    ],
  },
  {
    id: 'safety',
    title: 'Content & Safety',
    items: [
      { label: 'Safety mode', value: 'Protected', highlight: true },
      { label: 'Reported content', value: '2 items reviewed' },
      { label: 'Blocked users', value: '4 accounts' },
    ],
  },
  {
    id: 'help',
    title: 'Help',
    items: [
      { label: 'Support center', value: 'Open' },
      { label: 'Privacy policy', value: 'View' },
      { label: 'Community guidelines', value: 'Review' },
    ],
  },
]

export const profileStats = [
  { label: 'Posts', value: '482' },
  { label: 'Followers', value: '24.8k' },
  { label: 'Following', value: '1.2k' },
]
