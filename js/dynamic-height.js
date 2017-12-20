/*
 * @author Weidi Zhang
 */

const pageMarginBottom = 40;

$(document).ready(function() {
    $(window).resize(adjustTabContentHeight);
    adjustTabContentHeight();
});

function adjustTabContentHeight() {
    const heightAbove = $('.tab-content').position().top;
    let excessivePadding = $('.tab-content').css('padding');
    excessivePadding = parseInt(excessivePadding.substr(0, excessivePadding.length - 2)) * 2;

    let contentHeight = $(window).height() - heightAbove;
    contentHeight -= excessivePadding + pageMarginBottom + 5;

    $('.tab-content').height(contentHeight);
}