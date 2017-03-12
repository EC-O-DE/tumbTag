$(function() {

  var tumbTag = {

    tags : [],

    $tumbTagSelector : null,
    tumbTagElem      : '<div id="tumbTag"></div>',
    tumbTagElemCss   : {
      'position'           : 'absolute',
      'left'               : '1200px',
      'top'                : '400px',
      '-webkit-transform'  : 'translateX(-50%) translateY(-100%)',
      'z-index'            : '1011',
      'width'              : '200px',
      'color'              : '#fff',
      'margin-bottom'      : '1em',
      '-webkit-transition' : 'top .3s ease-in-out'
    },

    $actionsSelector : null,
    actionsElem      : '<div id="tumbTag-actions"></div>',
    actionsElemCss   : {
      'font-size'     : '1.5em',
      'cursor'        : 'pointer',
      'margin-bottom' : '.5em'
    },

    $iconAddSelector : null,
    iconAddElem      : '<i class="icon_edit_pencil"></i>',
    iconAddElemCss   : {
      'font-size'   : '1.5em',
      'line-height' : '1em'
    },

    $addListSelector : null,
    addListElemCss   : {
      'width'            : '200px',
      'height'           : '250px',
      'background-color' : '#fff',
      'box-sizing'       : 'border-box',
      'padding'          : '1em'
    },

    $addListNameSelector : null,
    addListNameElem      : '<input id="tumbTag-addListName"></input>',
    addListNameElemCss   : {
      'width'         : '100%',
      'margin-bottom' : '1em'
    },

    $addListTagsSelector : null,
    addListTagsElem      : '<textarea id="tumbTag-addListTags"></textarea>',
    addListTagsElemCss   : {
      'width'  : '100%',
      'height' : '100px'
    },

    $addListButtonSelector : null,
    addListButtonElem      : '<button id="tumbTag-addListButton">Done</button>',
    addListButtonElemCss   : {
      'padding'          : '.2em 1em',
      'display'          : 'block',
      'margin'           : '0 auto',
      'background-color' : '#529ecc'
    },

    $tagListsSelector : null,
    tagListsElem      : '<ul id="tumbTag-tagLists"></ul>',
    tagListsElemCss   : {
      'height'     : '250px',
      'overflow-y' : 'scroll'
    },
    listElem          : '<li class="tumbTag-list"></li>',
    listElemCss       : {
      'cursor'           : 'pointer',
      'padding'          : '10px',
      'background-color' : 'rgba(0, 0, 0, 0.07)',
      'margin-bottom'    : '1em'
    },

    $iconRemoveSelector : null,
    iconRemoveElem      : '<i class="icon_close"></i>',
    iconRemoveElemCss   : {
      'float'        : 'right',
      'margin-right' : '.4em',
      'font-size'    : '1.3em',
      'line-height'  : '1em'
    },



    /**
     * The list being edited.
     * @type {Object}
     *       {String} name
     *       {Array} list
     */
    editingList : null,



    init : function () {

      var that          = this,
          getStoredTags = window.localStorage.tags
            ? this.syncStorages.bind(this)
            : this.getSavedTags.bind(this)

      getStoredTags().
        then(function (tags) {
          that.tags = tags
          that.periodicallyCheckIfRender()
        })

    },



    appendTags : function ($selector) {

      var $shouldAppendTo = $('.tag-input-wrapper .editor-plaintext'),
          tagObj          = this.tags[$selector.index()]


      _.each(tagObj.list, function (tag) {
        $shouldAppendTo.append('<span>' + tag + '</span>')
        $shouldAppendTo.trigger('focus')
        $shouldAppendTo.trigger('blur')
      })

      setTimeout(function () {
        $('.tag-input-wrapper .editor-placeholder').text('')
      }, 0)

    },



    removeList : function ($selector) {

      this.tags = _.reject(this.tags, function (tagObj) {
        return tagObj.name === $selector.parent().text()
      })

      chrome.storage.sync.set({ 'tags' : this.tags })
      $selector.parent().remove()
      this.adjustPosition()

    },



    bindNewTagListsEvent : function () {
      $('.tumbTag-list').last().click(this.onClickTagList.bind(this))
      $('.icon_close').last().click(this.onClickRemoveList.bind(this))
    },



    bindTagListsEvent : function () {
      $('.tumbTag-list').click(this.onClickTagList.bind(this))
      $('.icon_close').click(this.onClickRemoveList.bind(this))
    },



    onClickTagList : function (event) {

      // If the add list selector is open, edit the list
      if (this.isEditorVisible()) {
        this.editTagList($(event.currentTarget))
      }
      //  If the add list selector is closed, append the tags
      else {
        this.appendTags($(event.currentTarget))
      }

      return false

    },



    editTagList : function ($selector) {

      // Get the list being edited
      var tagList      = this.tags[$selector.index()]
      this.editingList = tagList

      // Render the list
      this.renderEditor()

    },



    onClickRemoveList : function (event) {
      this.removeList($(event.currentTarget))
      return false
    },



    adjustPosition : function () {

      var $postContainer = $('.post-container')
      var postTop        = $postContainer.offset().top
      var postLeft       = $postContainer.offset().left
      var postHeight     = $postContainer.height()
      var postWidth      = $postContainer.width()

      var finalTop = (postTop + postHeight + 250)
      // It's a modal (a.k.a reblog), the page is not scrollable like usual
      // therefore place the tumbTag element at a different posisition
      if ($postContainer.parents('.post-forms-modal').length) {
        finalTop = (postTop + postHeight)
      }
      this.$tumbTagSelector.css('top', finalTop.toString() + 'px')
      this.$tumbTagSelector.css('left', (postLeft + postWidth + 200).toString() + 'px')

    },



    appendTagLists : function () {

      var that = this

      this.$tumbTagSelector.append(this.tagListsElem)
      this.$tagListsSelector = $('#tumbTag-tagLists')
      this.$tagListsSelector.css(this.tagListsElemCss)

      _.each(this.tags, function (tagObj) {
        that.$tagListsSelector.append('<li class="tumbTag-list">' + tagObj.name + that.iconRemoveElem + '</li>')
      })

      $('.tumbTag-list').css(this.listElemCss)
      $('.icon_close').css(this.iconRemoveElemCss)
      this.bindTagListsEvent()

    },



    setListName : function (listName) {

      if (this.editingList) {
        return listName
      }

      var tags         = this.tags,
          loop         = 5,
          existingName = listName

      existingName = _.find(tags, function (tagObj) {
        return tagObj.name === listName
      })

      while (existingName && loop) {
        listName     = listName + '1'
        existingName = _.find(tags, function (tagObj) {
          return tagObj.name === listName
        })
        loop--
      }

      return listName

    },



    addList : function (name, list) {

      this.tags.push({
        name : name,
        list : list
      })

      this.save()

    },



    editList : function (name, list) {

      // NOTE: Mutation is bad
      this.editingList.name = name
      this.editingList.list = list

      this.save()

    },



    save : function () {
      chrome.storage.sync.set({ tags : this.tags })
    },



    appendNewList : function (newList) {

      this.$addListSelector.hide('medium')
      this.$tagListsSelector
        .append('<li class="tumbTag-list">' + newList.name + this.iconRemoveElem + '</li>')

      $('.tumbTag-list').css(this.listElemCss)
      $('.icon_close').css(this.iconRemoveElemCss)
      this.bindNewTagListsEvent()

      this.adjustPosition()

    },



    bindValidateList : function () {
      this.$addListButtonSelector.click(this.onClickAddListButton.bind(this))
    },



    onClickAddListButton : function () {

      let listName = this.setListName(this.$addListNameSelector.val())
      let tags     = this.$addListTagsSelector.val().replace(/\r\n/g, '\n').split('\n')
      tags         = _.filter(tags, function (tag) { return !!tag })

      if (this.editingList) {
        this.editList(listName, tags)
        this.editingList = null
      }
      else {
        this.addList(listName, tags)
        this.appendNewList(_.last(this.tags))
      }

      this.toggleAddList()

      return false

    },



    toggleAddList : function () {

      // If the editor is visible, hide it
      if (this.isEditorVisible()) {
        this.hideEditor()
        return
      }

      // If the editor doesn't exist, create it
      if (!this.$addListSelector) {
        this.createEditor()
      }

      // If the editor is hidden, show it
      this.renderEditor()
      this.showEditor()

    },



    hideEditor() {
      this.$addListSelector.hide('medium')
    },


    showEditor() {
      this.$addListSelector.show('medium')
    },


    createEditor() {

      this.$addListSelector = $('<div id="tumbTag-addList"></div>')
      this.$addListSelector.hide()
      
      // Container
      this.$iconAddSelector.after(this.$addListSelector)
      this.$addListSelector.css(this.addListElemCss)

      // List name
      this.$addListSelector.append(this.addListNameElem)
      this.$addListNameSelector = $('#tumbTag-addListName')
      this.$addListNameSelector.css(this.addListNameElemCss)
      this.$addListNameSelector.before('<p style="font-size:13px;font-weight:700px;color:#444">List name</p>')

      // List tags
      this.$addListSelector.append(this.addListTagsElem)
      this.$addListTagsSelector = $('#tumbTag-addListTags')
      this.$addListTagsSelector.css(this.addListTagsElemCss)
      this.$addListTagsSelector.before('<p style="font-size:13px;font-weight:700px;color:#444">List tags</p>')

      // Validate List
      this.$addListSelector.append(this.addListButtonElem)
      this.$addListButtonSelector = $('#tumbTag-addListButton')
      this.$addListButtonSelector.css(this.addListButtonElemCss)

      this.bindValidateList()

    },



    isEditorVisible() {
      return this.$addListSelector && this.$addListSelector.css('display') === 'block'
    },



    renderEditor() {

      // Get the list data
      var name
      var list
      if (this.editingList) {
        name = this.editingList.name
        list = this.editingList.list
        this.$addListButtonSelector.text('Edit')
      }
      else {
        name = 'Blogging'
        list = ['tag1', 'tag2', 'tag3']
        this.$addListButtonSelector.text('Done')
      }

      this.$addListNameSelector.val(name)
      this.$addListTagsSelector.val(list.join('\n'))

    },



    bindActions : function () {

      var that = this

      $('#tumbTag-actions .icon_edit_pencil').click(function () {
        that.toggleAddList()
        return false
      })

    },



    appendActions : function () {

      this.$tumbTagSelector.append(this.actionsElem)
      this.$actionsSelector = $('#tumbTag-actions')
      this.$actionsSelector.css(this.actionsElemCss)

      this.$actionsSelector.append(this.iconAddElem)
      this.$iconAddSelector = $('.icon_edit_pencil')
      this.$iconAddSelector.css(this.iconAddElemCss)

      this.bindActions()

    },



    buildTumbTag : function () {

      if (!this.$tumbTagSelector) {
        $('body').append(this.tumbTagElem)

        this.$tumbTagSelector = $('#tumbTag')
        this.$tumbTagSelector.css(this.tumbTagElemCss)

        this.adjustPosition()

        this.appendActions()

        this.appendTagLists()
      }

    },



    showTumbTag : function () {

      if (this.$tumbTagSelector && this.$tumbTagSelector.length && this.$tumbTagSelector.css('display') === 'none') {

        this.adjustPosition()
        // adjust position when the post's size change
        $('.post-container').bind('DOMSubtreeModified', this.adjustPosition.bind(this))
        return this.$tumbTagSelector.show()

      }

      this.buildTumbTag()
      // adjust position when the post's size change
      $('.post-container').bind('DOMSubtreeModified', this.adjustPosition.bind(this))

    },



    hideTumbTag : function () {

      if (this.$tumbTagSelector && this.$tumbTagSelector.length) {
        this.$tumbTagSelector.hide()
      }

    },



    periodicallyCheckIfRender : function () {

      var that = this

      setTimeout(function () {
        $('.post-form--tag-editor').length ? that.showTumbTag() : that.hideTumbTag()
        that.periodicallyCheckIfRender()
      }, 2000)

    },



    syncStorages : function () {

      var deferred = Q.defer(),
          tags     = JSON.parse(window.localStorage.tags)

      chrome.storage.sync.set({ 'tags': tags })
      chrome.storage.sync.get('tags', function (tags) {
        window.localStorage.clear()
        deferred.resolve(tags.tags)
      })

      return deferred.promise

    },



    setTagExample : function () {

      this.tags = [
        {
          name : 'Example',
          list : ['tag1', 'tag2', 'tag3']
        }
      ]

      this.save()

    },



    getSavedTags : function () {

      var that     = this,
          deferred = Q.defer()

      chrome.storage.sync.get('tags', function (tags) {

        if (tags && tags.tags && tags.tags.length) {
          return deferred.resolve(tags.tags)
        }

        that.setTagExample()

        chrome.storage.sync.get('tags', function (tags) {
          return deferred.resolve(tags.tags)
        })
      })
      return deferred.promise
    }

  }



  tumbTag.init()

})
