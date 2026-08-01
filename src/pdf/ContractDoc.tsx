import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import type { FormValues } from '../ui/schema';
import type { AnnuityResult } from '../domain/annuity';

const won = (n: number) => n.toLocaleString('ko-KR');
const kdate = (d: string) => `${d.slice(0, 4)}년 ${Number(d.slice(5, 7))}월 ${Number(d.slice(8, 10))}일`;

const s = StyleSheet.create({
  page: { fontFamily: 'NanumMyeongjo', fontSize: 11, lineHeight: 1.7, paddingVertical: 56, paddingHorizontal: 52 },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 24 },
  preamble: { marginBottom: 14 },
  article: { marginBottom: 8 },
  articleTitle: { fontWeight: 'bold' },
  closing: { marginTop: 14, marginBottom: 20 },
  madeDate: { textAlign: 'center', marginBottom: 24 },
  partyBlock: { marginBottom: 14 },
  partyRow: { flexDirection: 'row', alignItems: 'center' },
  partyLabel: { width: 110, fontWeight: 'bold' },
  seal: { width: 44, height: 44, marginLeft: 8 },
  sealPlaceholder: { marginLeft: 8, color: '#888' },
});

export interface ContractProps {
  values: FormValues;
  result: AnnuityResult;
  donorSeal?: string;
  doneeSeal?: string;
  madeDate: string;
}

export function ContractDoc({ values, result, donorSeal, doneeSeal, madeDate }: ContractProps) {
  const { donor, donee, terms } = values;
  const method = terms.method === '기타' ? (terms.methodEtc ?? '') : terms.method;
  return (
    <Document title="유기정기금 현금증여계약서" language="ko">
      <Page size="A4" style={s.page}>
        <Text style={s.title}>현금 증여 계약서 (유기정기금)</Text>
        <Text style={s.preamble}>
          증여자 {donor.name}(이하 "갑"이라 한다)과 수증자 {donee.name}(이하 "을"이라 한다)은
          다음과 같이 현금 증여계약을 체결한다.
        </Text>
        <View style={s.article}>
          <Text style={s.articleTitle}>제1조 (목적)</Text>
          <Text>갑은 갑 소유의 현금을 아래 조항에 따라 을에게 정기적으로 증여할 것을 약정하고, 을은 이를 승낙한다.</Text>
        </View>
        <View style={s.article}>
          <Text style={s.articleTitle}>제2조 (증여의 내용)</Text>
          <Text>
            1. 갑은 {kdate(terms.startDate)}부터 {kdate(terms.endDate)}까지 매월 {terms.paymentDay}일에
            금 {won(terms.monthlyAmount)}원을 을에게 지급한다.{'\n'}
            2. 제1항에 따른 지급 총액은 금 {won(result.totalPrincipal)}원이며, 상속세 및 증여세법 시행령
            제62조 제1호에 따라 평가한 유기정기금 평가액은 금 {won(result.totalDiscounted)}원이다.
          </Text>
        </View>
        <View style={s.article}>
          <Text style={s.articleTitle}>제3조 (지급 방법)</Text>
          <Text>갑은 제2조의 금원을 {method} 방법으로 을 명의의 계좌({terms.bank} {terms.account})에 입금한다.</Text>
        </View>
        <View style={s.article}>
          <Text style={s.articleTitle}>제4조 (비용 부담 및 무상성)</Text>
          <Text>
            1. 이 증여에 소요되는 제반 비용은 갑의 부담으로 한다.{'\n'}
            2. 갑은 이 증여와 관련하여 을에게 어떠한 유상의 대가도 청구하지 아니하며, 이 증여는 무상으로 한다.
          </Text>
        </View>
        <View style={s.article}>
          <Text style={s.articleTitle}>제5조 (계약의 효력)</Text>
          <Text>이 계약은 계약 체결일부터 효력이 발생한다.</Text>
        </View>
        <Text style={s.closing}>
          위 계약의 체결을 증명하기 위하여 이 계약서 2통을 작성하여 갑과 을이 서명·날인한 후 각 1통씩 보관한다.
        </Text>
        <Text style={s.madeDate}>{kdate(madeDate)}</Text>

        <View style={s.partyBlock}>
          <View style={s.partyRow}>
            <Text style={s.partyLabel}>증여자(갑)</Text>
            <Text>성명: {donor.name}</Text>
            {donorSeal ? <Image style={s.seal} src={donorSeal} /> : <Text style={s.sealPlaceholder}>(인)</Text>}
          </View>
          <Text>주민등록번호: {donor.rrn}    주소: {donor.address}</Text>
        </View>
        <View style={s.partyBlock}>
          <View style={s.partyRow}>
            <Text style={s.partyLabel}>수증자(을)</Text>
            <Text>성명: {donee.name}</Text>
            {doneeSeal ? <Image style={s.seal} src={doneeSeal} /> : <Text style={s.sealPlaceholder}>(인)</Text>}
          </View>
          <Text>주민등록번호: {donee.rrn}    주소: {donee.address}</Text>
        </View>
      </Page>
    </Document>
  );
}
