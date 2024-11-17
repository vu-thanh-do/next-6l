const navigationData = {
	menu: [
		{
			name: 'About Us',
			items: [
				{
					name: 'Our Mission',
					href: '/about',
				},
				{
					name: 'Our Values',
					href: '/value',
				},
				{
					name: 'The Story',
					href: '/story',
				},
				{
					name: 'Client Benefits',
					href: '/benefit',
				},
			],
			href: '/about'
		},
		{
			name: 'Our Services',
			items: [
				{
					name: 'Accounting',
					href: '/services#accounting',
				},
				{
					name: 'Taxation',
					href: '/services#taxation',
				},
				{
					name: 'Business Advisory',
					href: '/services#business-advisory',
				},
				{
					name: 'Others',
					href: '/services#others',
				},
			],
			href: '/services',
		},
		{
			name: 'Franchise Program',
			items: [
				{
					name: 'Program Overview',
					href: '/franchise#overview',
				},
				{
					name: 'Franchise Benefits',
					href: '/franchise#benefit',
				},
				{
					name: 'Application Process',
					href: '/franchise#application',
				},
			],
			href:'/franchise'
		},
		{
			name: 'Contact',
			href: '/contact',
			items: [
				{
					image: '/images/icon/tel.svg',
					href: 'tel:+61355231234',
					name: '(+61) 355 231 234',
				},
				{
					image: '/images/icon/mail.svg',
					href: 'mailto:hello@stoneaccounting.com.au',
					name: 'hello@stoneaccounting.com.au',
				},
			],
		},
	] satisfies NavMenu[],
};

export default navigationData;
