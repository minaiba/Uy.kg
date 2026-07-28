-- Add editable about page content: stats and features
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS about_stats jsonb DEFAULT '[{"icon":"award","value":"12+","label":{"ru":"лет опыта","en":"years of experience","kg":"жыл тажрыйба"}},{"icon":"building","value":"500+","label":{"ru":"объектов продано","en":"properties sold","kg":"сатылган объект"}},{"icon":"users","value":"1200+","label":{"ru":"довольных клиентов","en":"happy clients","kg":"каназат кардарлар"}},{"icon":"trending","value":"98%","label":{"ru":"успешных сделок","en":"successful deals","kg":"ишттелген сделка"}}]'::jsonb;

ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS about_features jsonb DEFAULT '{"ru":["Полный спектр услуг","Опытные риелторы","Юридическое сопровождение","Индивидуальный подход","Бесплатные консультации","Безопасные сделки"],"en":["Full range of services","Experienced realtors","Legal support","Individual approach","Free consultations","Safe transactions"],"kg":["Кызматтардын толук спектри","Тажрыйбалуу риелторлор","Юридикалык колдоо","Жеке мамиле","Акысыз кеңештер","Коопсуз сделкалар"]}'::jsonb;

-- Seed default pages so admin has content to manage
INSERT INTO pages (slug, title, excerpt, content, is_published, show_in_menu, sort_order)
VALUES 
  ('privacy-policy', 
   '{"ru":"Политика конфиденциальности","en":"Privacy Policy","kg":"Конфиденциальдүүлүк саясаты"}'::jsonb,
   '{"ru":"","en":"","kg":""}'::jsonb,
   '{"blocks":[{"type":"text","title":{"ru":"Политика конфиденциальности","en":"Privacy Policy","kg":"Конфиденциальдүүлүк саясаты"},"text":{"ru":"Мы уважаем вашу конфиденциальность...","en":"We respect your privacy...","kg":"Биз сиздин конфиденциальдүүлүктү урматтайбыз..."},"image_url":null,"images":null}]}'::jsonb,
   true, false, 1),
  ('terms-of-service',
   '{"ru":"Условия использования","en":"Terms of Service","kg":"Колдонуу шарттары"}'::jsonb,
   '{"ru":"","en":"","kg":""}'::jsonb,
   '{"blocks":[{"type":"text","title":{"ru":"Условия использования","en":"Terms of Service","kg":"Колдонуу шарттары"},"text":{"ru":"Используя наш сайт, вы соглашаетесь...","en":"By using our site, you agree...","kg":"Биздин сайтты колдонуу менен, сиз макулсуз..."},"image_url":null,"images":null}]}'::jsonb,
   true, false, 2)
ON CONFLICT (slug) DO NOTHING;