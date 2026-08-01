type ManualPromoProps = {
  variant: 'card' | 'inline';
};

const MANUAL_URL = 'https://ctee.kr/item/store/91932';

export function ManualPromo({ variant }: ManualPromoProps) {
  const isCard = variant === 'card';

  return (
    <aside className={`manual-promo manual-promo-${variant}`}>
      <span className="manual-promo-badge">유료 매뉴얼</span>
      <h2>세무사가 검토한 우리 아이 증여 실무 매뉴얼</h2>
      <p>
        {isCard
          ? '무료 가이드가 입문이라면, 매뉴얼은 실전입니다. 세무사 자문 Q&A, 이미 입금한 돈 수습법, 홈택스 실제 화면 따라하기까지 44페이지에 담았습니다.'
          : '이미 입금한 돈 수습법, 홈택스 실제 화면 따라하기 등 실전 내용은 유료 매뉴얼에 담겨 있어요.'}
      </p>
      <a href={MANUAL_URL} target="_blank" rel="noopener noreferrer">
        자세히 보기 →
      </a>
    </aside>
  );
}
