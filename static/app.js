async function requests(url, method = 'GET', data = null) {
    try {
        const headers = {}
        let body

        if (data) {
            headers['Content-Type'] = 'application/json'
            body = JSON.stringify(data)
        }
        const response = await fetch(url, {
                                method,
                                headers,
                                body
                                })
        return await response.json()
    } catch (e) {
        console.warn('Error', e.message);
    }
}

async function getTraitTypes(){ // надо ли куда-то возвращать и принимать переменные? 
    const traits = await requests('/api/traittypes');
    console.log(traits);
    return traits;
}

async function setNewTraitType(){
    const str = document.getElementById("textTrait").value;
    const data = await requests('/api/traittypes', 'POST', {name: str})
    console.log(data);
}

async function getTraits(){
    const titles = await requests('/api/traits');
    console.log(titles);
    return titles;
}

async function setNewTrait(){
    const trait = document.getElementById("textTitleTrait").value; // ТУТ обязательно должно быть число - номер трейта
    const title = document.getElementById("textTitleName").value;
    const probability = document.getElementById("textTitleProbaility").value;
    //должна быть проверка на пустоту всех полей. Если что-то пустое, abort операции.

    const data = await requests('/api/traits', 'POST', {trait: Number(trait), title: title, probability: Number(probability)})
    console.log(data);
}

async function getConflicts(){
    const conflicts = await requests('/api/conflicts');
    console.log(conflicts);
    return conflicts;
}

async function setNewConflict(){
    const trait1 = document.getElementById("textConflictTrait1").value;;
    const trait2 = document.getElementById("textConflictTrait2").value
    const traitSubstitute = document.getElementById("textConflictTraitSubstitute").value

    //если что-то пусто - abort операции.

    const data = await requests('/api/conflicts', 'POST', {trait1: Number(trait1),
                                                           trait2: Number(trait2),
                                                           traitSubstitute: Number(traitSubstitute)}) 
    console.log(data);
}

async function getUnconditionalMatch(){
    const unconditionalMatch = await requests('/api/unconditionalMatch');
    console.log(unconditionalMatch);
    return unconditionalMatch;
}

async function setNewUnconditionalMatch(){
    const trait = document.getElementById("textUnconditionalMatchtTrait1").value; // ТУТ обязательно должно быть число - номер трейта
    const unconditionalMatch = document.getElementById("textUnconditionalMatchTrait2").value;
    //должна быть проверка на пустоту всех полей. Если что-то пустое, abort операции.

    const data = await requests('/api/unconditionalMatch', 'POST', {trait: Number(trait), unconditionalMatch: Number(unconditionalMatch)})
    console.log(data);
}

async function generateNFT(){
    const amountNFT = document.getElementById("NFTamount").value;
    const collectionName = document.getElementById("NFTcollectionName").value;
    const data = await requests('api/nft', 'POST', {amountNFT: Number(amountNFT), collectionName: collectionName })

    console.log(data)
}

async function uploadIMG(){
    var formData = new FormData();
    let fileData = [];
    $.each($("#uploadImg")[0].files, function(key, input){
        console.log('input:', input);
        formData.append('multiple_images', input);

    });
    console.log('Finish formData:',formData);
    $.ajax({
        url : "/upload",
        type: "POST",
        data : formData,
        processData: false,
        contentType: false,
        success:function(data, textStatus, jqXHR){
            console.log(data);
            console.log(textStatus);
        },
        error: function(jqXHR, textStatus, errorThrown){
            //if fails     
        }
    });
}
async function bundleMake () {
    const bundleNumber = document.getElementById("textBundleMake").value;
    const bundle = await requests('/api/bundle', 'POST', {'bundle':bundleNumber});
    console.log(bundle);
}