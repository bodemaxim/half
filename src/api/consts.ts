export const enumConfig = {
    users: [
      { value: 'sasha', label: 'Саша' },
      { value: 'max', label: 'Макс' },
    ],
    categories: [
      { value: 'supermarket', label: 'Супермаркет' },
      { value: 'food_delivery', label: 'Доставка еды' },
      { value: 'restaurants', label: 'Рестораны' },
      { value: 'farmacy', label: 'Аптека' },
      { value: 'cosmetics', label: 'Косметика' },
      { value: 'doctors', label: 'Врачи' },
      { value: 'clothes', label: 'Одежда' },
      { value: 'footwear', label: 'Обувь' },
      { value: 'gadgets', label: 'Гаджеты' },
      { value: 'sport', label: 'Спорт' },
      { value: 'entertainment', label: 'Развлечения' },
      { value: 'alcohole', label: 'Алкоголь' },
      { value: 'public_transport', label: 'Общественный транспорт' },
      { value: 'taxi', label: 'Такси' },
      { value: 'furniture', label: 'Мебель' },
      { value: 'household_items', label: 'Товары для дома' },
      { value: 'gifts', label: 'Подарки'},
      { value: 'construction_materials', label: 'Стройматериалы' },
      { value: 'biils', label: 'Счета за дом' },
      { value: 'stationery', label: 'Канцтовары' },
      { value: 'close_period', label: 'Закрытие периода' },
      { value: 'holiday_tickets', label: 'Авиабилеты'},
      { value: 'holiday_accomodation', label: 'Отели'},
      { value: 'holiday_other', label: 'Траты на отдыхе'},
      { value: 'other', label: 'Другое' },
      { value: 'apt_eleven', label: 'кв 11'},
      { value: 'subscriptions', label: 'Подписки'},
      {value: 'smoke', label: 'Курение'},
      {value: 'unknown', label: 'Неизвестно'}
    ],
    transactionTypes: [
      { value: 'purchase', label: 'Покупка' },
      { value: 'transfer', label: 'Перевод' },
    ],
} as const;


export const categoryGroups = {
  food: {
    label: 'Еда',
    'header-icon': 'mdiSilverwareForkKnife',
    'header-bg-color': '#FF5733',
    'body-bg-color': '#FFF1EB',
    categories: [
      { value: 'supermarket', label: 'Супермаркет' },
      { value: 'food_delivery', label: 'Доставка еды' },
      { value: 'restaurants', label: 'Рестораны' },
      { value: 'alcohole', label: 'Алкоголь' }
    ]
  },
  health: {
    label: 'Здоровье',
    'header-icon': 'mdiHeartPulse',
    'header-bg-color': '#33AA57',
    'body-bg-color': '#EFFBF2',
    categories: [
      { value: 'farmacy', label: 'Аптека' },
      { value: 'cosmetics', label: 'Косметика' },
      { value: 'doctors', label: 'Врачи' },
      { value: 'sport', label: 'Спорт'}
    ]
  },
  house: {
    label: 'Дом',
    'header-icon': 'mdiHomeVariant',
    'header-bg-color': '#3357FF',
    'body-bg-color': '#EEF2FF',
    categories: [
      { value: 'biils', label: 'Счета за дом' },
      { value: 'apt_eleven', label: 'кв 11' },
      { value: 'furniture', label: 'Мебель' },
      { value: 'household_items', label: 'Товары для дома' },
      { value: 'construction_materials', label: 'Стройматериалы' }
    ]
  },
  shopping: {
    label: 'Покупки',
    'header-icon': 'mdiShopping',
    'header-bg-color': '#FF33A1',
    'body-bg-color': '#FFF0F7',
    categories: [
      { value: 'clothes', label: 'Одежда' },
      { value: 'footwear', label: 'Обувь' },
      { value: 'gadgets', label: 'Гаджеты' },
      { value: 'gifts', label: 'Подарки' },
      { value: 'stationery', label: 'Канцтовары' },
    ]
  },
  transport: {
    label: 'Транспорт',
    'header-icon': 'mdiBus',
    'header-bg-color': '#1FA971',
    'body-bg-color': '#EDFDF6',
    categories: [
      { value: 'public_transport', label: 'Общественный транспорт' },
      { value: 'taxi', label: 'Такси' }
    ]
  },
  rest: {
    label: 'Отдых',
    'header-icon': 'mdiPalmTree',
    'header-bg-color': '#FF3333',
    'body-bg-color': '#FFF0F0',
    categories: [
      { value: 'entertainment', label: 'Развлечения' },
      { value: 'holiday_tickets', label: 'Авиабилеты' },
      { value: 'holiday_accomodation', label: 'Отели' },
      { value: 'holiday_other', label: 'Траты на отдыхе' },
      { value: 'smoke', label: 'Курение' },
    ]
  },
  other: {
    label: 'Другое',
    'header-icon': 'mdiDotsHorizontal',
    'header-bg-color': '#4F46E5',
    'body-bg-color': '#EEF2FF',
    categories: [
      { value: 'subscriptions', label: 'Подписки' },
      { value: 'other', label: 'Другое' },
      { value: 'close_period', label: 'Закрытие периода' },
      { value: 'unknown', label: 'Неизвестно' },
    ]
  }
} as const