export interface SubIssue {
  id: number;
  name: string;
}

export interface Issue {
  id: number;
  name: string;
  subIssues: SubIssue[];
}
export const ISSUES: Issue[] = [
];


export const STATES_DATA = [
  {
    id: 1,
    name: 'California',
    counties: [
      { id: 101, name: 'Los Angeles County' },
      { id: 102, name: 'San Diego County' }
    ]
  },
  {
    id: 2,
    name: 'Texas',
    counties: [
      { id: 201, name: 'Harris County' },
      { id: 202, name: 'Dallas County' }
    ]
  },
  {
    id: 3,
    name: 'Florida',
    counties: [
      { id: 301, name: 'Miami-Dade County' },
      { id: 302, name: 'Orange County' }
    ]
  }
];