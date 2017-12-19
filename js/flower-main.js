$(document).ready(function() {
    $('[data-asset]').click(assetTabClick);
})

function assetTabClick() {
    const [assetType, assetName] = $(this).data('asset').split(':');

    switch (assetType) {
        case 'dashboard':
            flipToOverview();
            break;

        case 'cryptocurrency':
        case 'stock':
            flipToAsset(assetType, assetName);
            break;

        default:
            break;
    }
}

function flipToOverview() {

}

function flipToAsset(type, name) {
    prettyType = type[0].toUpperCase() + type.substr(1);
    $('.navbar-header').text(prettyType + ': ' + name);
}