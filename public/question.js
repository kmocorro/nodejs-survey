$('document').ready(function()
{ 
    $('.yesFirst').hide();
    $("#btn-survey").prop("disabled",true);

     $('.radioYes').on('click', function(){
        $('.yesFirst').show();
        $("#btn-survey").prop("disabled",false);
    });

    $('.radioNo').on('click', function(){
        $('.yesFirst').hide();
        $("#btn-survey").prop("disabled",false);
    });


    /* validation */
	 $("#survey_form").validate({
        rules:
        {
            shuttleIn: {
                required: true
            },
              
            shuttleOut: {
                required: true
            },
         },
         messages:
         {
              shuttleIn:{
                        required: "Select your incoming service"
                       },
              shuttleOut: "Select your outgoing service",
         },
         submitHandler: submitForm	
         });  

	   
	   /* survey submit */
	   function submitForm()
	   {		
			var data = $("#survey_form").serialize();
			
			$.ajax({
				
			type : 'POST',
			url  : '/survey/validate', // api url
			data : data,
			beforeSend: function()
			{	
                $("#error").fadeOut();
                
                $("#btn-survey").prop("disabled",true);
                
				$("#btn-survey").html('Saving ...');
			},
			success :  function(response)
			   {						
					if(response=="ok"){

						$("#btn-survey").html('Saving ...');
                        $("#btn-survey").prop("disabled",true);

						setTimeout(' window.location.href = "/thankyou"; ',2000);
					}
					else{
									
						$("#error").fadeIn(1000, function(){						
							$("#error").html('<div class="alert alert-danger">'+response+' </div>');
							
							let counter = 5;
							let interval = setInterval(function(){
								counter--;
								$("#btn-survey").html('Please wait in ' + counter + ' secs');

								if(counter !== 1){
									$("#btn-survey").html('Please wait in ' + counter + ' secs');
								} else {
									$("#btn-survey").html('Please wait in ' + counter + ' sec');
									clearInterval(interval);
								}
							},	1000);

							setTimeout(function(){
								$("#btn-survey").prop("disabled",false);
								$("#btn-survey").html('Submit');
							}, counter +'000');
							
							
                        });
                        
                       /* $("#employee_id").click(function() {
                            $(this).closest('form').find("input[type=text], textarea").val("");
                        }); */
					}
			  }
			});
				return false;
		}
	   /* login submit */	  
	   
});