import type { UserRepos } from '@/domain/models';

export const sampleRepos: UserRepos = {
  login: 'octocat',
  repos: [
    {
      name: 'Spoon-Knife',
      description: 'This repo is for demonstration purposes only.',
      stars: 13_100,
      forks: 156_000,
      language: { name: 'HTML', color: '#e34c26' },
      isArchived: false,
    },
    {
      name: 'Hello-World',
      description: 'My first repository on GitHub!',
      stars: 2_900,
      forks: 2_700,
      language: null,
      isArchived: false,
    },
    {
      name: 'octocat',
      description: 'Profile README',
      stars: 900,
      forks: 40,
      language: null,
      isArchived: false,
    },
    {
      name: 'linguist',
      description:
        'Language Savant. If your repository language is being reported incorrectly, send us a pull request!',
      stars: 650,
      forks: 280,
      language: { name: 'Ruby', color: '#701516' },
      isArchived: false,
    },
    {
      name: 'git-consortium',
      description: 'This repo is for demonstration purposes only.',
      stars: 410,
      forks: 120,
      language: null,
      isArchived: true,
    },
    {
      name: 'test-repo1',
      description: null,
      stars: 90,
      forks: 12,
      language: { name: 'TypeScript', color: '#3178c6' },
      isArchived: false,
    },
  ],
};
