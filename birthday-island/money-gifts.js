export const MONEY_TIERS={
  small:{amount:500,scale:.48,color:0x378971,label:'SMALL GIFT'},
  medium:{amount:1500,scale:.66,color:0x385f99,label:'MEDIUM GIFT'},
  large:{amount:5000,scale:.87,color:0x954e79,label:'GRAND GIFT'}
};
// Deliberately not spawned or counted until their hiding places are chosen.
export const LEGENDARY_RESERVE={budget:4000,gifts:[{amount:2000,tier:'legendary',pos:null},{amount:2000,tier:'legendary',pos:null}]};
export const rupees=value=>'₹'+value.toLocaleString('en-IN');
