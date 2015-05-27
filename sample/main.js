var SAMPLE_APP_VERSION = '0.0.1',
    BOXCAR_CLIENT_USERNAME = 'johndoe',
    BOXCAR_PROJECT_TAGS = [],
    BOXCAR_CLIENT_KEY = '<BOXCAR_CLIENT_KEY>',
    BOXCAR_CLIENT_SECRET = '<BOXCAR_CLIENT_SECRET>';

function updateButton(registered) {
    var pushStatusDiv = document.querySelector('.js-push-status'),
        pushButton = document.querySelector('.js-push-button');
    
    if (!!registered) {
        pushStatusDiv.textContent = 'Registered';
        pushButton.textContent = 'Disable Push Messages';
    } else {
        pushStatusDiv.textContent = 'Not registered';
        pushButton.textContent = 'Enable Push Messages';
    }
}

window.addEventListener('load', function() {
    var pushButton = document.querySelector('.js-push-button'),
        credentials = new BoxcarCredentials(BOXCAR_CLIENT_KEY,
                BOXCAR_CLIENT_SECRET),
        pushHost = new BoxcarPushHost('boxcar-api.io'),
        config = new BoxcarConfig(credentials,'./service-worker.js',
                SAMPLE_APP_VERSION,pushHost),
        boxcar = __initBoxcar(config);

    /**
     * Add logic to register / unregister button
     */
    pushButton.addEventListener('click', function() {
      if (!boxcar.isPushEnabled()) {
          boxcar.register(BOXCAR_PROJECT_TAGS, BOXCAR_CLIENT_USERNAME).then(
              function() {
                  console.debug('Registration success');
                  updateButton(true);
              },
              function(err) {
                  console.error(err);
                  updateButton(boxcar.isPushEnabled());
              }
          );
      } else {
          boxcar.unregister().then(
              function() {
                  console.debug('Unregister success');
                  updateButton(false);
              },
              function(err) {
                  console.error(err);
                  updateButton(boxcar.isPushEnabled());
              }
          );
      }
    });
    
    updateButton(boxcar.isPushEnabled());
    
    /**
     * Retrieve the list of project tags from Boxcar service
     * and show it in the HTML page.
     * TODO: show a multiple selection list with each tag
     * and use this selection to send the registration.
     */
    boxcar.getTags().then(
            function(tags) {
                for (var i = 0; i < tags.length; i++) {
                    var tagsDiv = document.querySelector('.js-tags'),
                        str = '';
                    for (i = 0; i<tags.length; i++) {
                        str = str.concat(tags[i])
                                 .concat(';');
                    }
                    tagsDiv.textContent = str;
                }
            },
            function(err) {
                console.error(err);
            }
    );

    /**
     * Check if push is supported by this browser.
     * Disable registration button if it doesn't.
     */
    boxcar.checkSupported().then(function(){
        pushButton.disabled = false;
    }).catch(function(err){
        console.error(err);
    });
    
});