// iterator used to give unique id to each folder in makeFolder
let f_i = 0

function makeFolder(folderObj) {
    let parent = document.createElement('ul');
    parent.classList.add('list-group');
    for (let f in folderObj) {
        if (f == "files") {
            for (let fileName of folderObj.files) {
                let file = document.createElement('li');
                file.classList = "folder list-group-item";
                file.innerText = fileName;
                parent.appendChild(file);
            }
        }
        else {
            let folder = $('<li class="folder list-group-item">' +
            '<a class="folder-link collapsed" role="button" href="#folder-' + 
            f_i + '" data-toggle="collapse" aria-expanded="false"><span class="caret"></span>' + 
            f + '</a><div class="folder-list collapse" id="folder-' + f_i++ + '"></div></li>');
            // Refer to add_directory.js for more information on recursion
            $('div', folder).append(makeFolder(folderObj[f]));
            $(parent).append(folder);
        }
    }
    return parent;
}

$(function() {
    $.getJSON('scripts/folder.json').done(function(folderObj) {
        let data = makeFolder(folderObj);
        $(".container").append(makeFolder(folderObj));
        $('.folder').click(function(ev) {
            // dont do anything if a child was clicked on
            if (ev.target !== this) {
                return;
            }
            $(ev.currentTarget).toggleClass('selected');
            // don't let it propagate to the parent elements
            ev.stopPropagation();
        });
    });
});