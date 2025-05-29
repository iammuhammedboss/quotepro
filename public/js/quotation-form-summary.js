// 🔥 FIXED quotation-form-summary.js - FORCE SUMMARY CALCULATION
function updateSummary() {
  console.log('🧮 Updating summary...');
  
  const itemsJson = document.getElementById('items-json');
  let itemList = [];

  // ✅ TRY MULTIPLE SOURCES FOR ITEM DATA
  if (window.itemList && Array.isArray(window.itemList)) {
    itemList = window.itemList;
    console.log('📦 Using global itemList:', itemList);
  } else if (itemsJson && itemsJson.value) {
    try {
      itemList = JSON.parse(itemsJson.value);
      console.log('📦 Using items from JSON input:', itemList);
    } catch (e) {
      console.error('❌ Invalid items JSON:', e);
      itemList = [];
    }
  } else if (window.serverItems && Array.isArray(window.serverItems)) {
    itemList = window.serverItems;
    console.log('📦 Using server items:', itemList);
  }

  if (!Array.isArray(itemList)) {
    console.log('⚠️ No valid item list found');
    itemList = [];
  }

  // ✅ CALCULATE TOTALS
  const total = itemList.reduce((sum, item) => {
    const amount = parseFloat(item.amount) || 0;
    console.log(`Item amount: ${amount}`);
    return sum + amount;
  }, 0);

  console.log('💰 Total calculated:', total);

  let discount = parseFloat(document.getElementById('discount')?.value) || 0;
  let vatRate = parseFloat(document.getElementById('vat_rate')?.value) || 0;
  let roundOff = parseFloat(document.getElementById('round_off')?.value) || 0;

  const vatAmount = ((total - discount) * vatRate) / 100;
  const grandTotal = total - discount + vatAmount + roundOff;

  console.log('📊 Summary:', { total, discount, vatRate, vatAmount, roundOff, grandTotal });

  // ✅ UPDATE ALL FIELDS WITH PROPER FORMATTING
  const totalAmountField = document.getElementById('total_amount');
  const vatAmountField = document.getElementById('vat_amount');
  const grandTotalField = document.getElementById('grand_total');
  const discountField = document.getElementById('discount');
  const vatRateField = document.getElementById('vat_rate');
  const roundOffField = document.getElementById('round_off');

  if (totalAmountField) totalAmountField.value = total.toFixed(3);
  if (vatAmountField) vatAmountField.value = vatAmount.toFixed(3);
  if (grandTotalField) grandTotalField.value = grandTotal.toFixed(3);
  if (discountField) discountField.value = discount.toFixed(3);
  if (vatRateField) vatRateField.value = vatRate.toFixed(3);
  if (roundOffField) roundOffField.value = roundOff.toFixed(3);

  console.log('✅ Summary updated successfully');
}

// ✅ FORCE UPDATE WHEN ITEMS CHANGE
function forceSummaryUpdate() {
  console.log('🔄 Force summary update triggered');
  setTimeout(() => {
    updateSummary();
  }, 100);
}

// ✅ MAKE FUNCTIONS GLOBALLY AVAILABLE
window.updateSummary = updateSummary;
window.forceSummaryUpdate = forceSummaryUpdate;

window.addEventListener('DOMContentLoaded', () => {
  console.log('📊 Summary system initialized');
  
  // ✅ ADD EVENT LISTENERS FOR MANUAL CHANGES
  ['discount', 'vat_rate', 'round_off'].forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', updateSummary);
      input.addEventListener('blur', () => {
        input.value = (parseFloat(input.value) || 0).toFixed(3);
        updateSummary();
      });
    }
  });

  // ✅ INITIAL CALCULATION AFTER ALL SCRIPTS LOAD
  setTimeout(() => {
    updateSummary();
    console.log('🚀 Initial summary calculation complete');
  }, 500);

  // ✅ PERIODIC UPDATES TO ENSURE CONSISTENCY
  setInterval(() => {
    const itemsJson = document.getElementById('items-json');
    if (itemsJson && itemsJson.value && itemsJson.value !== '[]') {
      updateSummary();
    }
  }, 2000);
});