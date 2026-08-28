export interface Work {
	title: string;
	description: string;
	url?: string;
}

export const works: Work[] = [
	{
		title: 'オセローグ',
		description: '爆破と侵食を使って遊ぶ、ローカル2人対戦のWebオセロ。',
		url: '/works/oserog/',
	},
	{
		title: 'この個人サイト',
		description: 'Astroで作っている、制作物と記録を置く場所。',
	},
];
