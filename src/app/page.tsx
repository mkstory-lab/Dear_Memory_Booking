'use client';

import React, { useState, useMemo } from 'react';
import { Header } from '@/components/ui/Header';
import { HomeLandingView } from '@/components/home/HomeLandingView';
import { ProductCatalogView } from '@/components/catalog/ProductCatalogView';
import { TermsAgreementStep } from '@/components/contract-form/TermsAgreementStep';
import { WeddingInfoSection } from '@/components/contract-form/WeddingInfoSection';
import { CustomerInfoSection } from '@/components/contract-form/CustomerInfoSection';
import { ProductSelectSection } from '@/components/contract-form/ProductSelectSection';
import { OptionSelectSection } from '@/components/contract-form/OptionSelectSection';
import { DiscountBenefitSection } from '@/components/contract-form/DiscountBenefitSection';
import { RequestNotesSection } from '@/components/contract-form/RequestNotesSection';
import { PriceSummarySticky } from '@/components/contract-form/PriceSummarySticky';
import { FinalConfirmStep } from '@/components/contract-form/FinalConfirmStep';
import { SubmissionSuccessView } from '@/components/contract-form/SubmissionSuccessView';
import { TermsModal } from '@/components/ui/TermsModal';
import { DemoMailboxModal } from '@/components/demo/DemoMailboxModal';
import { ContractFormData } from '@/types/contract';
import { calculateContractPrice } from '@/lib/pricing';
import { ArrowLeft } from 'lucide-react';

type ViewMode = 'home' | 'catalog' | 'terms' | 'form' | 'confirm' | 'success';

export default function CustomerContractPage() {
  // 화면 네비게이션 상태 (기본값: 홈 화면)
  const [viewMode, setViewMode] = useState<ViewMode>('home');

  // 폼 상태
  const [formData, setFormData] = useState<ContractFormData>({
    weddingDate: '',
    weddingTime: '13:00',
    weddingVenue: '',
    weddingHall: '',
    makeupLocation: '',
    groomName: '',
    groomPhone: '',
    groomFamilyMembers: '',
    brideName: '',
    bridePhone: '',
    brideFamilyMembers: '',
    email: '',
    productId: 'standard', // 기본 실속형
    optionIds: [],
    partnerDiscount: false,
    partnerName: '',
    sundayDiscount: false,
    portfolioConsent: false,
    reviewContractCashback: false,
    reviewMainCashback: false,
    shootRequestNotes: '',
    retouchRequestNotes: '',
    requestNotes: '',
    referralSource: '',
    instagramId: '',
    blogUrl: '',
    termsAgreed: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReviewUrl, setSubmittedReviewUrl] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 실시간 가격 계산
  const pricing = useMemo(() => {
    return calculateContractPrice({
      productId: formData.productId,
      optionIds: formData.optionIds,
      weddingDate: formData.weddingDate,
      partnerDiscount: formData.partnerDiscount,
      partnerName: formData.partnerName,
      portfolioConsent: formData.portfolioConsent,
      reviewContractCashback: formData.reviewContractCashback,
      reviewMainCashback: formData.reviewMainCashback,
      manualAdjustment: formData.manualAdjustment,
    });
  }, [formData]);

  // 필드 변경
  const handleFieldChange = (fields: Partial<ContractFormData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
    const updatedKeys = Object.keys(fields);
    setErrors((prev) => {
      const next = { ...prev };
      updatedKeys.forEach((key) => delete next[key]);
      return next;
    });
  };

  // 옵션 토글
  const handleToggleOption = (optionId: string) => {
    setFormData((prev) => {
      const exists = prev.optionIds.includes(optionId);
      return {
        ...prev,
        optionIds: exists
          ? prev.optionIds.filter((id) => id !== optionId)
          : [...prev.optionIds, optionId],
      };
    });
  };

  // 폼 검증
  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.weddingDate) errs.weddingDate = '예식일을 선택해 주세요.';
    if (!formData.weddingTime) errs.weddingTime = '예식 시간을 입력해 주세요.';
    if (!formData.weddingVenue.trim()) errs.weddingVenue = '웨딩홀 명을 입력해 주세요.';
    if (!formData.weddingHall.trim()) errs.weddingHall = '홀 명칭을 입력해 주세요.';
    if (!formData.makeupLocation?.trim()) {
      errs.makeupLocation = '메이크업 장소 및 시간(미정이면 "미정")을 입력해 주세요.';
    }

    if (!formData.groomName.trim()) errs.groomName = '신랑 성명을 입력해 주세요.';
    if (!formData.groomPhone.trim()) errs.groomPhone = '신랑 연락처를 입력해 주세요.';
    if (!formData.groomFamilyMembers?.trim()) {
      errs.groomFamilyMembers = '신랑님 직계 가족 구성원(예: 부모님, 형, 남동생)을 입력해 주세요.';
    }

    if (!formData.brideName.trim()) errs.brideName = '신부 성명을 입력해 주세요.';
    if (!formData.bridePhone.trim()) errs.bridePhone = '신부 연락처를 입력해 주세요.';
    if (!formData.brideFamilyMembers?.trim()) {
      errs.brideFamilyMembers = '신부님 직계 가족 구성원(예: 부모님, 언니)을 입력해 주세요.';
    }

    if (!formData.email.trim()) {
      errs.email = '계약서를 받으실 이메일을 입력해 주세요.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = '올바른 이메일 형식이 아닙니다.';
    }

    if (formData.partnerDiscount && (!formData.partnerName || !formData.partnerName.trim())) {
      errs.partnerName = '짝꿍 할인을 선택하신 경우 추천인(짝꿍 날짜_성함)을 반드시 입력해 주세요.';
    }

    if (!formData.shootRequestNotes?.trim()) {
      errs.shootRequestNotes = '본식스냅 촬영 시 요청사항을 자세히 입력해 주세요.';
    }
    if (!formData.retouchRequestNotes?.trim()) {
      errs.retouchRequestNotes = '후보정 시 요청사항을 자세히 입력해 주세요.';
    }
    if (!formData.referralSource?.trim()) {
      errs.referralSource = '디어메모리를 알게 되신 경로를 선택해 주세요.';
    }

    if (!formData.termsAgreed) {
      errs.termsAgreed = '계약 약관 확인 및 동의는 필수입니다.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // 최종 확인 화면으로 이동
  const handleGoToConfirm = () => {
    if (validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setViewMode('confirm');
    } else {
      alert('필수 입력 항목을 모두 작성해 주세요.');
    }
  };

  // 최종 제출 (POST /api/submit-contract)
  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/submit-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || '계약정보 제출에 실패했습니다.');
      }

      setSubmittedReviewUrl(data.reviewUrl);
      setViewMode('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setSubmitError(err.message || '네트워크 오류가 발생했습니다.');
      alert(`제출 오류: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 전체 초기화
  const handleReset = () => {
    setFormData({
      weddingDate: '',
      weddingTime: '13:00',
      weddingVenue: '',
      weddingHall: '',
      makeupLocation: '',
      groomName: '',
      groomPhone: '',
      groomFamilyMembers: '',
      brideName: '',
      bridePhone: '',
      brideFamilyMembers: '',
      email: '',
      productId: 'standard',
      optionIds: [],
      partnerDiscount: false,
      partnerName: '',
      sundayDiscount: false,
      portfolioConsent: false,
      reviewContractCashback: false,
      reviewMainCashback: false,
      shootRequestNotes: '',
      retouchRequestNotes: '',
      referralSource: '',
      instagramId: '',
      blogUrl: '',
      requestNotes: '',
      termsAgreed: false,
    });
    setErrors({});
    setViewMode('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
      {/* 고정 브랜드 헤더 */}
      <Header />

      {/* 메인 컨텐츠 영역 */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6">
        
        {/* ========================================================
            1. 홈 화면 (Home Landing View)
            - [계약상품 구경하기] vs [계약정보 작성하기] 2대 선택 카드
        ======================================================== */}
        {viewMode === 'home' && (
          <HomeLandingView
            onSelectCatalog={() => {
              setViewMode('catalog');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectApply={() => {
              setViewMode('terms');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* ========================================================
            2. 상품 구경하기 화면 (Product Catalog View)
        ======================================================== */}
        {viewMode === 'catalog' && (
          <ProductCatalogView
            onBackToHome={() => {
              setViewMode('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectProductAndApply={(productId) => {
              handleFieldChange({ productId });
              setViewMode('terms');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* ========================================================
            3. 약관 선동의 단계 (Terms Agreement Step)
        ======================================================== */}
        {viewMode === 'terms' && (
          <TermsAgreementStep
            termsAgreed={formData.termsAgreed}
            onAgreeChange={(agreed) => handleFieldChange({ termsAgreed: agreed })}
            onProceed={() => {
              setViewMode('form');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onBackToHome={() => {
              setViewMode('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* ========================================================
            4. 계약정보 입력 폼 화면 (Form View)
        ======================================================== */}
        {viewMode === 'form' && (
          <div className="space-y-6">
            
            {/* 상단 네비게이션 */}
            <div className="flex items-center justify-between border-b border-[#EBE3D5] pb-3">
              <button
                type="button"
                onClick={() => {
                  setViewMode('terms');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#6E5C3D] hover:text-[#322A1B] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>약관 동의 단계로 돌아가기</span>
              </button>
              <span className="text-xs text-[#8F7A56]">Step 2 of 3 &bull; 정보 입력</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* 좌측 메인 폼 (lg:col-span-8) */}
              <div className="lg:col-span-8 space-y-8 bg-[#FFFFFF] border border-[#EBE3D5] rounded-3xl p-6 sm:p-8 shadow-sm">
                
                {/* 인트로 타이틀 */}
                <div className="border-b border-[#F5F1EA] pb-5">
                  <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-[#8F7A56] uppercase">
                    APPLICATION FORM
                  </span>
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#322A1B] mt-1">
                    본식스냅 계약정보 작성
                  </h2>
                  <p className="text-xs sm:text-sm text-[#6E5C3D] mt-1.5 leading-relaxed">
                    상담이 완료된 고객님께 전달드리는 전용 페이지입니다.<br className="hidden sm:inline" />
                    아래 정보를 작성해 주시면 확인 후 정식 계약서를 이메일로 보내드립니다.
                  </p>
                </div>

                {/* 1. 예식 정보 */}
                <WeddingInfoSection
                  weddingDate={formData.weddingDate}
                  weddingTime={formData.weddingTime}
                  weddingVenue={formData.weddingVenue}
                  weddingHall={formData.weddingHall}
                  makeupLocation={formData.makeupLocation}
                  onChange={handleFieldChange}
                  errors={errors}
                />

                {/* 2. 고객 정보 */}
                <CustomerInfoSection
                  groomName={formData.groomName}
                  groomPhone={formData.groomPhone}
                  groomFamilyMembers={formData.groomFamilyMembers}
                  brideName={formData.brideName}
                  bridePhone={formData.bridePhone}
                  brideFamilyMembers={formData.brideFamilyMembers}
                  email={formData.email}
                  onChange={handleFieldChange}
                  errors={errors}
                />

                {/* 3. 상품 선택 */}
                <ProductSelectSection
                  selectedProductId={formData.productId}
                  onSelect={(id) => handleFieldChange({ productId: id })}
                />

                {/* 4. 추가 옵션 */}
                <OptionSelectSection
                  selectedOptionIds={formData.optionIds}
                  onToggleOption={handleToggleOption}
                />

                {/* 5. 할인 및 혜택 */}
                <DiscountBenefitSection
                  isSunday={pricing.isSunday}
                  partnerDiscount={formData.partnerDiscount}
                  partnerName={formData.partnerName}
                  portfolioConsent={formData.portfolioConsent}
                  reviewContractCashback={formData.reviewContractCashback}
                  reviewMainCashback={formData.reviewMainCashback}
                  onChange={handleFieldChange}
                  errors={errors}
                />

                {/* 6. 요청사항 */}
                <RequestNotesSection
                  shootRequestNotes={formData.shootRequestNotes}
                  retouchRequestNotes={formData.retouchRequestNotes}
                  referralSource={formData.referralSource}
                  instagramId={formData.instagramId}
                  blogUrl={formData.blogUrl}
                  requestNotes={formData.requestNotes}
                  termsAgreed={formData.termsAgreed}
                  onOpenTermsModal={() => setIsTermsOpen(true)}
                  onChange={handleFieldChange}
                  errors={errors}
                />

                {/* 다음 버튼 */}
                <div className="pt-4 border-t border-[#F5F1EA]">
                  <button
                    type="button"
                    onClick={handleGoToConfirm}
                    className="w-full h-14 bg-[#322A1B] text-[#FAF8F5] rounded-2xl text-sm sm:text-base font-semibold hover:bg-[#1E1910] transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    <span>계약 내용 최종 확인하기</span>
                    <span>&rarr;</span>
                  </button>
                </div>

              </div>

              {/* 우측 Sticky 실시간 금액 요약 */}
              <div className="hidden lg:block lg:col-span-4 sticky top-24">
                <PriceSummarySticky
                  pricing={pricing}
                  onProceed={handleGoToConfirm}
                  proceedLabel="최종 확인하기"
                />
              </div>

              {/* 모바일 전용 하단 고정 바 */}
              <div className="lg:hidden">
                <PriceSummarySticky
                  pricing={pricing}
                  onProceed={handleGoToConfirm}
                  proceedLabel="최종 확인하기"
                />
              </div>

            </div>
          </div>
        )}

        {/* ========================================================
            5. 최종 확인 화면 (Confirm Step)
        ======================================================== */}
        {viewMode === 'confirm' && (
          <FinalConfirmStep
            formData={formData}
            pricing={pricing}
            onBack={() => {
              setViewMode('form');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}

        {/* ========================================================
            6. 제출 완료 화면 (Success View)
        ======================================================== */}
        {viewMode === 'success' && (
          <SubmissionSuccessView
            email={formData.email}
            reviewUrl={submittedReviewUrl}
            onReset={handleReset}
          />
        )}

      </main>

      {/* 공통 푸터 */}
      <footer className="border-t border-[#EBE3D5] py-8 mt-12 bg-[#FAF8F5] text-center text-xs text-[#8F7A56]">
        <div className="max-w-3xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-[#6E5C3D]">DEAR MEMORY FOR BOOKING</p>
          <p>웨딩 본식스냅 전문 스튜디오 | 대표 한민규</p>
          <p className="text-[11px] text-[#A8987E] pt-1">
            Copyright &copy; {new Date().getFullYear()} DEAR MEMORY. All rights reserved.
          </p>
        </div>
      </footer>

      {/* 약관 전문 열람 모달 */}
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />

      {/* 데모 메일 수신함 플로팅 버튼 & 모달 */}
      <DemoMailboxModal />
    </div>
  );
}
