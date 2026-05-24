import { KartaLogo } from '@/components/KartaLogo'
import { BlobBackground } from '@/components/BlobBackground'
import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div style={{ background: '#F4F6FF', minHeight: '100dvh', position: 'relative' }}>
      <BlobBackground />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Back link */}
        <Link href="/" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          color: '#5C7CFA',
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: 15,
          marginBottom: 40,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Назад
        </Link>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          <KartaLogo size={44} />
          <span style={{
            fontSize: 24,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #5C7CFA 0%, #748FFC 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>Karta</span>
        </div>

        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1a1d2e', marginBottom: 8, letterSpacing: '-0.5px' }}>
          Политика конфиденциальности
        </h1>
        <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 48 }}>Последнее обновление: май 2025 г.</p>

        <div style={{
          background: 'rgba(255,255,255,0.65)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.85)',
          borderRadius: 24,
          padding: '40px 44px',
          boxShadow: '0 4px 24px rgba(92,124,250,0.08)',
        }}>
          <Section title="1. Общие положения">
            Настоящая Политика конфиденциальности описывает, как приложение Karta («мы», «нас», «наше») собирает, использует и защищает персональные данные пользователей. Используя приложение, вы соглашаетесь с условиями данной политики.
          </Section>

          <Section title="2. Какие данные мы собираем">
            Мы можем собирать следующие категории данных:
            <ul>
              <li><b>Данные профиля</b> — имя, дата рождения, пол, которые вы указываете при регистрации.</li>
              <li><b>Медицинские данные</b> — информация о прививках, принимаемых лекарствах и результатах анализов, которую вы вводите вручную.</li>
              <li><b>Технические данные</b> — тип устройства, версия операционной системы, анонимные данные об использовании приложения (без привязки к личности).</li>
            </ul>
            Мы не собираем медицинские данные автоматически и не имеем доступа к вашим записям в медицинских учреждениях.
          </Section>

          <Section title="3. Как мы используем данные">
            Собранные данные используются исключительно для:
            <ul>
              <li>предоставления функций приложения (хранение и отображение ваших медицинских записей);</li>
              <li>отправки напоминаний о прививках и приёме лекарств;</li>
              <li>улучшения качества приложения на основе анонимной статистики.</li>
            </ul>
            Мы не продаём, не передаём и не раскрываем ваши персональные данные третьим лицам в коммерческих целях.
          </Section>

          <Section title="4. Хранение и защита данных">
            Ваши данные хранятся на защищённых серверах с применением современного шифрования. Доступ к данным ограничен и предоставляется только авторизованным сотрудникам, которым это необходимо для поддержки сервиса.
            <br /><br />
            Мы применяем технические и организационные меры для защиты данных от несанкционированного доступа, изменения, раскрытия или уничтожения.
          </Section>

          <Section title="5. Передача данных третьим лицам">
            Мы можем передавать данные третьим лицам только в следующих случаях:
            <ul>
              <li>с вашего явного согласия;</li>
              <li>по требованию закона или уполномоченных государственных органов;</li>
              <li>в рамках работы технических партнёров (например, облачных провайдеров), которые обеспечивают работу нашей инфраструктуры и связаны обязательствами по конфиденциальности.</li>
            </ul>
          </Section>

          <Section title="6. Ваши права">
            Вы имеете право в любой момент:
            <ul>
              <li>запросить доступ к своим данным;</li>
              <li>исправить неточные или устаревшие данные;</li>
              <li>удалить свой аккаунт и все связанные данные;</li>
              <li>отозвать согласие на обработку данных.</li>
            </ul>
            Для реализации любого из этих прав обратитесь к нам по адресу: <a href="mailto:valeriya.astahova@gmail.com" style={{ color: '#5C7CFA' }}>valeriya.astahova@gmail.com</a>
          </Section>

          <Section title="7. Дети">
            Приложение не предназначено для детей младше 13 лет. Мы не собираем осознанно данные о детях без согласия родителей или законных представителей. Если вам стало известно, что ребёнок предоставил нам данные без такого согласия, пожалуйста, свяжитесь с нами.
          </Section>

          <Section title="8. Изменения политики">
            Мы вправе обновлять настоящую Политику конфиденциальности. Об изменениях мы уведомим вас через приложение или по электронной почте. Продолжая использовать приложение после вступления изменений в силу, вы принимаете обновлённую политику.
          </Section>

          <Section title="9. Контакты" last>
            Если у вас есть вопросы или предложения относительно настоящей Политики конфиденциальности, пожалуйста, свяжитесь с нами:
            <br /><br />
            <a href="mailto:valeriya.astahova@gmail.com" style={{ color: '#5C7CFA', fontWeight: 600 }}>valeriya.astahova@gmail.com</a>
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ marginBottom: last ? 0 : 36 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1d2e', marginBottom: 12 }}>{title}</h2>
      <div style={{ fontSize: 15, color: '#4b5563', lineHeight: 1.75 }}>{children}</div>
    </div>
  )
}
