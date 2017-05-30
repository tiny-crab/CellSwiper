function getSwitch(id, data) {
 return `<div class="row"><div class="switch col offset-s4 offset-m3 offset-l1 center-align" style="padding-top: 20%;">
    <label>
        <span id="left-label-${id}">${data.l_label}</span>
        <input id="${data.field}" type="checkbox">
        <span class="lever"></span>
        <span id="right-label-${id}">${data.r_label}</span>
    </label>
  </div></div>`;
}

function getSwitchEdit(id, data) {
 return `<div class="row"><div class="switch col offset-s4 offset-m3 offset-l1 center-align" style="padding-top: 20%;">
            <label>
                <span id="left-label-${id}">${data.l_label}</span>
                <input disabled id="${data.field}" type="checkbox">
                <span class="lever"></span>
                <span id="right-label-${id}">${data.r_label}</span>
            </label>
        </div></div>
        <div class="row">
            <div class="input-field inline col s6"><input id="${data.field}-l_label" type="text" value="${data.l_label}" onkeyup="updateField('left-label-${id}', this.value)"><label for="${data.field}-l_label">Left Label</label></div>
            <div class="input-field inline col s6"><input id="${data.field}-r_label" type="text" value="${data.r_label}" onkeyup="updateField('right-label-${id}', this.value)"><label for="${data.field}-r_label">Right Label</label></div>
        </div>
        <div class="row">
            <div class="input-field inline col s12"><input id="${data.field}-field" type="text"><label for="${data.field}-field">DB field name</label></div>
        </div>`;
}

function getTextfield(id, data) {
    return `<div class="row">
        <div class="input-field col s12">
            <textarea id="${data.field}" class="materialize-textarea"></textarea>
            <label for="${data.field}">${data.label}</label>
        </div>
    </div>`;
}

function getTextfieldEdit(id, data) {
    return `<div class="row">
        <div class="input-field col s12">
            <textarea disabled id="${data.field}" class="materialize-textarea"></textarea>
            <label id="text-field-label-${id}" for="${data.field}">${data.label}</label>
        </div>
    </div>
    <div class="row">
        <div class="input-field"><input id="${data.field}-label" type="text" value="${data.label}" onkeyup="updateField('text-field-label-${id}', this.value)"><label for="${data.field}-label">Label</label></div>
    </div>
    <div class="row">
        <div class="input-field"><input id="${data.field}-field" type="text"><label for="${data.field}-field">DB Field name</label></div>
    </div`
}

function getRange(id, data) {
    return `<p class="range-field" style="margin-top: 20%;">
                <label for="${data.field}">Confidence</label>
                <input type="range" id="${data.field}" min="${data.min}" max="${data.max}"/>
            </p>`;
}

function getRangeEdit(id, data) {
    return `<p class="range-field" style="margin-top: 20%;">
                <label id="${data.field}-label-show" for="${data.field}">${data.label}</label>
                <input disabled type="range" id="${data.field}" min="${data.min}" max="${data.max}"/>
            </p>
            <div class="row">
                <div class="input-field"><input onkeyup="updateField('${data.field}-label-show', this.value)" id="${data.field}-label" type="text"><label for="${data.field}-label">Label</label></div>
            </div>
            <div class="row">
                <div class="input-field"><input id="${data.field}-field" type="text"><label for="${data.field}-field">DB Field name</label></div>
            </div>`;
}

function updateField(id, text) {
    $("#" + id).text(text);
}

function loadFeatureSet(cb) {
    $.getJSON('/feature-set?id=0').done(function(data) {
        let tab_list = [];
        let tab_content = [];
        for (let i = 0; i < data.length; i++) {
            input = data[i];
            tab_list.push(input.header);
            let tab = `<div id="tab-${i}" class="col s12 m6 l4 grey lighten-3">`;
            switch(input.type) {
                case "binary":
                    tab += getSwitch(i, input);
                    break;
                case "text":
                    tab += getTextfield(i, input);
                    break;
                case "range":
                    tab += getRange(i, input);
                    break;
                default:
                    console.log("Invalid type " + input.type);
                    break;
            }
            tab += `</div>`;
            tab_content.push(tab);
        }
        let tabs = `<ul id="input-tabs" class="tabs">`;
        for (let i = 0; i < tab_list.length; i++) {
            tabs += `<li class="tab col s3"><a href="#tab-${i}">${tab_list[i]}</a></li>`;
        }
        tabs += "</ul>";
        tabs += tab_content.join("");
        $("#tabs-wrapper").append($(tabs));
        cb();
    });
}

function postAnnotation(cb) {
    let annotation = {};
    $("#tabs-wrapper input").each(i => {
        annotation[this.id] = this.value;
    });
}