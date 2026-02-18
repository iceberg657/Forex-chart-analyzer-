
import React from 'react';
import { useNavigate } from '../hooks/useAppContext';
import { PRICING_PLANS } from '../constants';
import { PricingPlan } from '../types';
import { useAuth } from '../hooks/useAuth';

const CheckIcon: React.FC = () => (
  <svg className="w-5 h-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const PricingCard: React.FC<{ plan: PricingPlan }> = ({ plan }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const PLAN_MAP: { [key in 'Free' | 'Pro' | 'Apex']: string } = {
    'Free': 'Free Tier',
    'Pro': 'Pro Trader',
    'Apex': 'Apex Quant'
  };
  const isCurrentPlan = PLAN_MAP[user.plan] === plan.name;

  const handleCtaClick = (e: React.MouseEvent) => {
    if (isCurrentPlan) {
      e.preventDefault();
      return;
    }
    if (user.isGuest) {
      navigate('/signup');
    }
    // In a real app, this would link to a checkout page, e.g., Stripe
    // For now, it will just be a placeholder link
  };

  return (
    <div className={`rounded-2xl p-8 flex flex-col transition-all shadow-lg ${plan.isFeatured ? 'bg-red-500/5 dark:bg-red-900/10 backdrop-blur-xl border-red-500/50 scale-105 border' : 'bg-white/20 dark:bg-black/20 backdrop-blur-xl border-white/30 dark:border-white/10 border'}`}>
      {plan.isFeatured && (
        <div className="text-center mb-4">
          <span className="bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase">Most Popular</span>
        </div>
      )}
      <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white">{plan.name}</h3>
      <div className="mt-4 text-center text-gray-600 dark:text-gray-300">
        <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{plan.price}</span>
        {plan.price !== "$0" && <span className="text-base font-medium">/month</span>}
      </div>
      <ul className="mt-8 space-y-4">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <div className="flex-shrink-0">
              <CheckIcon />
            </div>
            <p className="ml-3 text-base text-gray-600 dark:text-gray-300">{feature}</p>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-8">
        <a 
          href={user.isGuest ? undefined : "#"} // Placeholder for upgrade link
          onClick={handleCtaClick}
          aria-disabled={isCurrentPlan}
          className={`w-full block text-center py-3 px-4 rounded-md font-medium transition-colors ${
            plan.isFeatured 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-white/30 dark:bg-white/10 hover:bg-white/40 dark:hover:bg-white/20 text-gray-800 dark:text-gray-200'
          } ${
            isCurrentPlan 
              ? 'bg-gray-400 dark:bg-gray-600 text-white dark:text-gray-300 cursor-not-allowed opacity-70' 
              : ''
          }`}
        >
          {isCurrentPlan ? 'Your Current Plan' : user.isGuest ? 'Get Started' : 'Upgrade Plan'}
        </a>
      </div>
    </div>
  );
};


const Pricing: React.FC = () => {
  return (
    <div>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Choose Your Plan</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Unlock your full trading potential with the right plan.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {PRICING_PLANS.map((plan) => (
          <PricingCard key={plan.name} plan={plan} />
        ))}
      </div>
    </div>
  );
};

export default Pricing;
