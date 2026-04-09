Attribute VB_Name = "Funciones"
Public Declare Function SetLocaleInfo Lib "kernel32" Alias "SetLocaleInfoA" (ByVal Locale As Long, ByVal LCType As Long, ByVal lpLCData As String) As Long
Public Declare Function GetSystemDefaultLCID Lib "kernel32" () As Long

Public Const LOCALE_ICENTURY = &H24 ' especificador de formato de siglo
Public Const LOCALE_ICOUNTRY = &H5 ' código del país
Public Const LOCALE_ICURRDIGITS = &H19 ' número de dígitos de la moneda local
Public Const LOCALE_ICURRENCY = &H1B ' modo de moneda positiva
Public Const LOCALE_IDATE = &H21 ' orden del formato de fecha corta
Public Const LOCALE_IDAYLZERO = &H26 ' número de ceros iniciales en el campo día
Public Const LOCALE_IDEFAULTCODEPAGE = &HB ' página de códigos predeterminada
Public Const LOCALE_IDEFAULTCOUNTRY = &HA ' código predeterminado del país
Public Const LOCALE_IDEFAULTLANGUAGE = &H9 ' Id. predeterminado del idioma
Public Const LOCALE_IDIGITS = &H11 ' número de dígitos fraccionarios
Public Const LOCALE_IINTLCURRDIGITS = &H1A ' nº de dígitos de la moneda internacional
Public Const LOCALE_ILANGUAGE = &H1 ' Id. de idioma
Public Const LOCALE_ILDATE = &H22 ' orden del formato de fecha larga
Public Const LOCALE_ILZERO = &H12 ' número de ceros iniciales de decimales
Public Const LOCALE_IMEASURE = &HD ' 0 = métrico, 1 = EE.UU.
Public Const LOCALE_IMONLZERO = &H27 ' número de ceros iniciales en el campo mes
Public Const LOCALE_INEGCURR = &H1C ' modo de moneda negativa
Public Const LOCALE_INEGSEPBYSPACE = &H57 ' símbolo de moneda separado por un espacio de cantidad negativa
Public Const LOCALE_INEGSIGNPOSN = &H53 ' posición del signo negativo
Public Const LOCALE_INEGSYMPRECEDES = &H56 ' símbolo de moneda precede a cantidad negativa
Public Const LOCALE_IPOSSEPBYSPACE = &H55 ' símbolo de moneda separado por un espacio de cantidad positiva
Public Const LOCALE_IPOSSIGNPOSN = &H52 ' posición del signo positivo
Public Const LOCALE_IPOSSYMPRECEDES = &H54 ' símbolo de moneda precede a cantidad positiva
Public Const LOCALE_ITIME = &H23 ' especificador de formato de hora
Public Const LOCALE_ITLZERO = &H25 ' número de ceros iniciales en el campo hora
Public Const LOCALE_NOUSEROVERRIDE = &H80000000 ' no usa sustituciones del usuario
Public Const LOCALE_S1159 = &H28 ' designador de AM
Public Const LOCALE_S2359 = &H29 ' designador de PM
Public Const LOCALE_SABBREVCTRYNAME = &H7 ' nombre abreviado del país
Public Const LOCALE_SABBREVDAYNAME1 = &H31 ' nombre abreviado para Lunes
Public Const LOCALE_SABBREVDAYNAME2 = &H32 ' nombre abreviado para Martes
Public Const LOCALE_SABBREVDAYNAME3 = &H33 ' nombre abreviado para Miércoles
Public Const LOCALE_SABBREVDAYNAME4 = &H34 ' nombre abreviado para Jueves
Public Const LOCALE_SABBREVDAYNAME5 = &H35 ' nombre abreviado para Viernes
Public Const LOCALE_SABBREVDAYNAME6 = &H36 ' nombre abreviado para Sábado
Public Const LOCALE_SABBREVDAYNAME7 = &H37 ' nombre abreviado para Domingo
Public Const LOCALE_SABBREVLANGNAME = &H3 ' nombre del idioma abreviado
Public Const LOCALE_SABBREVMONTHNAME1 = &H44 ' nombre abreviado para Enero
Public Const LOCALE_SABBREVMONTHNAME10 = &H4D ' nombre abreviado para Octubre
Public Const LOCALE_SABBREVMONTHNAME11 = &H4E ' nombre abreviado para Noviembre
Public Const LOCALE_SABBREVMONTHNAME12 = &H4F ' nombre abreviado para Diciembre
Public Const LOCALE_SABBREVMONTHNAME13 = &H100F
Public Const LOCALE_SABBREVMONTHNAME2 = &H45 ' nombre abreviado para Febrero
Public Const LOCALE_SABBREVMONTHNAME3 = &H46 ' nombre abreviado para Marzo
Public Const LOCALE_SABBREVMONTHNAME4 = &H47 ' nombre abreviado para Abril
Public Const LOCALE_SABBREVMONTHNAME5 = &H48 ' nombre abreviado para Mayo
Public Const LOCALE_SABBREVMONTHNAME6 = &H49 ' nombre abreviado para Junio
Public Const LOCALE_SABBREVMONTHNAME7 = &H4A ' nombre abreviado para Julio
Public Const LOCALE_SABBREVMONTHNAME8 = &H4B ' nombre abreviado para Agosto
Public Const LOCALE_SABBREVMONTHNAME9 = &H4C ' nombre abreviado para Septiembre
Public Const LOCALE_SCOUNTRY = &H6 ' nombre traducido del país
Public Const LOCALE_SCURRENCY = &H14 ' símbolo de moneda local
Public Const LOCALE_SDATE = &H1D ' separador de fecha
Public Const LOCALE_SDAYNAME1 = &H2A ' nombre largo para Lunes
Public Const LOCALE_SDAYNAME2 = &H2B ' nombre largo para Martes
Public Const LOCALE_SDAYNAME3 = &H2C ' nombre largo para Miércoles
Public Const LOCALE_SDAYNAME4 = &H2D ' nombre largo para Jueves
Public Const LOCALE_SDAYNAME5 = &H2E ' nombre largo para Viernes
Public Const LOCALE_SDAYNAME6 = &H2F ' nombre largo para Sábado
Public Const LOCALE_SDAYNAME7 = &H30 ' nombre largo para Domingo
Public Const LOCALE_SDECIMAL = &HE ' separador de decimales
Public Const LOCALE_SENGCOUNTRY = &H1002 ' nombre del país en inglés
Public Const LOCALE_SENGLANGUAGE = &H1001 ' nombre del idioma en inglés
Public Const LOCALE_SGROUPING = &H10 ' agrupación de dígitos
Public Const LOCALE_SINTLSYMBOL = &H15 ' símbolo de moneda internacional
Public Const LOCALE_SLANGUAGE = &H2 ' nombre traducido del idioma
Public Const LOCALE_SLIST = &HC ' separador de elementos de lista
Public Const LOCALE_SLONGDATE = &H20 ' cadena de formato de fecha larga
Public Const LOCALE_SMONDECIMALSEP = &H16 ' separador de decimales en moneda
Public Const LOCALE_SMONGROUPING = &H18 ' agrupación de moneda
Public Const LOCALE_SMONTHNAME1 = &H38 ' nombre largo para Enero
Public Const LOCALE_SMONTHNAME10 = &H41 ' nombre largo para Octubre
Public Const LOCALE_SMONTHNAME11 = &H42 ' nombre largo para Noviembre
Public Const LOCALE_SMONTHNAME12 = &H43 ' nombre largo para Diciembre
Public Const LOCALE_SMONTHNAME2 = &H39 ' nombre largo para Febrero
Public Const LOCALE_SMONTHNAME3 = &H3A ' nombre largo para Marzo
Public Const LOCALE_SMONTHNAME4 = &H3B ' nombre largo para Abril
Public Const LOCALE_SMONTHNAME5 = &H3C ' nombre largo para Mayo
Public Const LOCALE_SMONTHNAME6 = &H3D ' nombre largo para Junio
Public Const LOCALE_SMONTHNAME7 = &H3E ' nombre largo para Julio
Public Const LOCALE_SMONTHNAME8 = &H3F ' nombre largo para Agosto
Public Const LOCALE_SMONTHNAME9 = &H40 ' nombre largo para Septiembre
Public Const LOCALE_SMONTHOUSANDSEP = &H17 ' separador de miles en moneda
Public Const LOCALE_SNATIVECTRYNAME = &H8 ' nombre nativo del país
Public Const LOCALE_SNATIVEDIGITS = &H13 ' ASCII 0-9 nativo
Public Const LOCALE_SNATIVELANGNAME = &H4 ' nombre nativo del idioma
Public Const LOCALE_SNEGATIVESIGN = &H51 ' signo negativo
Public Const LOCALE_SPOSITIVESIGN = &H50 ' signo positivo
Public Const LOCALE_SSHORTDATE = &H1F ' cadena de formato de fecha corta
Public Const LOCALE_STHOUSAND = &HF ' separador de miles
Public Const LOCALE_STIME = &H1E ' separador de hora
Public Const LOCALE_STIMEFORMAT = &H1003 ' cadena de formato de hora
Public Sub RegistroError(oErr As ErrObject, sAction As String)
   Dim sMessage As String
    ' constante de error usada para indicar que el registro vigente
    ' está bloqueado y no se puede actualizar ni editar
    Const RECORD_LOCKED = 3260
    With Err
        Select Case .Number
            ' el registro no se puede editar
            Case RECORD_LOCKED:
                sMessage = "No puede " & sAction & " en este momento porque " _
                         & "el registro está bloqueado por otro " _
                         & "usuario."
            ' un error no esperado
            Case Else:
                sMessage = "ERROR #" & .Number & ": " & .Description
        End Select
    End With
    ' visualiza el mensaje de error que se ha creado
    MsgBox sMessage, vbExclamation, "ERROR"
End Sub

Public Sub Imprime_LP(NroComp As Long)
Dim LineaX As Double, LINEAY As Double, Texto As String, FactProv As String, VTP As String, VTP1 As Double
Dim TNeto_FP As Double, TIVA_FP As Double, Total_FP As Double, TNeto_Flet As Double, TIVA_Flet As Double
Set rsEncabLP = db.OpenRecordset("Select * From EncabLP Where NroLP = " & NroComp & "")
Printer.ScaleMode = 6
i = 0
For i = i + 1 To 2
    'imprime encabezado
    Printer.CurrentX = 155: Printer.CurrentY = 17
    Printer.Print NroComp
    Printer.CurrentX = 155: Printer.CurrentY = 20
    Printer.Print rsEncabLP!Fecha
    Set rsFleteros = db.OpenRecordset("Select * from Fleteros Where CodFlet = " & rsEncabLP!CodFlet & "")
    Printer.CurrentX = 33: Printer.CurrentY = 42
    Printer.Print rsEncabLP!CodFlet & "    " & rsFleteros!DescFlet
    Printer.CurrentX = 130: Printer.CurrentY = 42
    Printer.Print rsFleteros!Direccion
    Set rsSituacionIVA = db.OpenRecordset("Select * From SituacionIVa Where Codigo = " & rsFleteros!CodIVA & "")
    Printer.CurrentX = 25: Printer.CurrentY = 50
    Printer.Print rsFleteros!CodIVA & "     " & rsSituacionIVA!Descripcion
    Set rsSituacionIVA = Nothing
    Printer.CurrentX = 130: Printer.CurrentY = 50
    Printer.Print rsFleteros!Localidad
    Printer.CurrentX = 130: Printer.CurrentY = 57
    Printer.Print rsFleteros!CUIT
    'imprime detalle del Liq. Producto
    Printer.CurrentX = 80: Printer.CurrentY = 75
    Printer.Print FormatNumber(rsEncabLP!TGasOil)
    'busca factura proveedor
    Set rsFactProv_Liq = db.OpenRecordset("Select * From FactProv_Liq Where NroLP = " & NroComp & "")
    FactProv = "": TNeto_FP = 0: TIVA_FP = 0: Total_FP = 0
    Do While Not rsFactProv_Liq.EOF
        FactProv = FactProv & ", " & rsFactProv_Liq!NroFact
        Set rsEncabFactProv = db.OpenRecordset("Select * From EncabFactProv Where CodProv = " & rsEncabLP!CodFlet & " and NroFact = " & rsFactProv_Liq!NroFact & "")
        TNeto_FP = TNeto_FP + rsEncabFactProv!TotalNeto
        TIVA_FP = TIVA_FP + rsEncabFactProv!IVA
        Total_FP = Total_FP + rsEncabFactProv!Total
        rsFactProv_Liq.MoveNext
    Loop
    Printer.CurrentX = 150: Printer.CurrentY = 75
    Printer.Print FactProv
    
    Printer.CurrentX = 80: Printer.CurrentY = 85
    Printer.Print FormatNumber(rsEncabLP!TAdel)
    Printer.CurrentX = 165: Printer.CurrentY = 85
    Printer.Print FormatNumber(TNeto_FP)
    
    Printer.CurrentX = 80: Printer.CurrentY = 95
    Printer.Print FormatNumber(rsEncabLP!TFalt)
    Printer.CurrentX = 165: Printer.CurrentY = 95
    Printer.Print rsEncabLP!TNComis
    
    TNeto_Flet = TNeto_FP - rsEncabLP!TNComis
    TIVA_Flet = (TNeto_Flet * 21) / 100
    
    Printer.CurrentX = 165: Printer.CurrentY = 110
    Printer.Print FormatNumber(TNeto_Flet)
    Printer.CurrentX = 165: Printer.CurrentY = 120
    Printer.Print FormatNumber(TIVA_Flet)
    Printer.CurrentY = 102: Printer.CurrentX = 80
    Printer.Print FormatNumber(rsEncabLP!TEfvo)
    
    LINEAY = 118
    Set rsDetLPCH_P = db.OpenRecordset("SELECT * FROM DetLPCHPropios Where NroLP = " & NroComp & "")
    Do While Not rsDetLPCH_P.EOF
        Printer.CurrentX = 20: Printer.CurrentY = LINEAY
        Set rsCtaBcoPropias = db.OpenRecordset("Select * From CtaCtePropias Where CtaCte = '" & rsDetLPCH_P!CtaCte & "'")
        Printer.Print Mid(rsCtaBcoPropias!DescBco, 1, 10) & ". Nro: " & rsDetLPCH_P!NroCH
        Printer.CurrentX = 80: Printer.CurrentY = LINEAY
        Printer.Print FormatNumber(rsDetLPCH_P!Importe)
        LINEAY = LINEAY + 7
        rsDetLPCH_P.MoveNext
    Loop
    LINEAY = 161
    'cheques de terceros
    Set rsDetLPCHTer = db.OpenRecordset("Select * From DetLPCHTerc Where NroLP = " & NroComp & "")
    Do While Not rsDetLPCHTer.EOF
        Printer.CurrentX = 20: Printer.CurrentY = LINEAY
        Set rsBcos = db.OpenRecordset("Select * From Bancos Where CodBco = " & rsDetLPCHTer!CodBanco & "")
        Printer.Print Mid(rsBcos!DescBco, 1, 10) & ". Nro: " & rsDetLPCHTer!NroCH
        Set rsBcos = Nothing
        Printer.CurrentX = 80: Printer.CurrentY = LINEAY
        Printer.Print FormatNumber(rsDetLPCHTer!Importe)
        LINEAY = LINEAY + 7
        rsDetLPCHTer.MoveNext
    Loop
    
    
    Printer.CurrentX = 80: Printer.CurrentY = 210
    Printer.Print FormatNumber(rsEncabLP!TotalLP - rsEncabLP!TNComis * 1.21)
    Printer.CurrentX = 165: Printer.CurrentY = 210
    Printer.Print FormatNumber(rsEncabLP!TotalLP - rsEncabLP!TNComis * 1.21)
    xx = Redondear(rsEncabLP!TotalLP - rsEncabLP!TNComis * 1.21, 2)
    
    Texto = EnLetras(CStr(xx))
    Printer.CurrentX = 80: Printer.CurrentY = 233
    Printer.Print Texto
    Printer.NewPage
Next
Printer.EndDoc
End Sub
Public Function Redondear(dNumero As Double, iDecimales As Integer) As Double
    Dim lMultiplicador As Long
    Dim dRetorno As Double
    
    If iDecimales > 9 Then iDecimales = 9
    lMultiplicador = 10 ^ iDecimales
    dRetorno = CDbl(CLng(dNumero * lMultiplicador)) / lMultiplicador
    
    Redondear = dRetorno
End Function
Public Sub Imprime_FactCta(NroComp As Long)
Set rsEncabFactCta = db.OpenRecordset("Select * From EncabFactCta Where NroFact = " & NroComp & "")
Printer.ScaleMode = 6
Printer.Orientation = 2
Printer.FontSize = 8
i = 0
With Printer
For i = i + 1 To 2
    Printer.CurrentX = 190: Printer.CurrentY = 20
    Printer.Print NroComp
    Printer.CurrentX = 190: Printer.CurrentY = 25
    Printer.Print rsEncabFactCta!Fecha
    Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & rsEncabFactCta!Codigo & "")
    .CurrentX = 45: .CurrentY = 45
    Printer.Print rsEncabFactCta!Codigo
    .CurrentX = 55: .CurrentY = 45
    Printer.Print rsEmpresas!DescEmpresas
    .CurrentX = 135: .CurrentY = 45
    Printer.Print rsEmpresas!Direccion
    .CurrentX = 35: .CurrentY = 52
    Set rsSituacionIVA = db.OpenRecordset("Select * From SituacionIVA Where Codigo = " & rsEmpresas!CodIVA & "")
    Printer.Print rsSituacionIVA!Descripcion
    Set rsSituacionIVA = Nothing
    .CurrentX = 220: .CurrentY = 45
    Printer.Print rsEmpresas!Localidad
    .CurrentX = 130: .CurrentY = 52
    Printer.Print rsEmpresas!CUIT
    'Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabFactCta!CodFlet & "")
    '.CurrentX = 40: .CurrentY = 75
    'Printer.Print rsFleteros!DescFlet
    '.CurrentX = 140: .CurrentY = 75
    'Printer.Print rsFleteros!CUIT
    '.CurrentX = 40: .CurrentY = 83
    'Printer.Print rsFleteros!Direccion
    '.CurrentX = 140: .CurrentY = 83
    'Set rsSituacionIVA = db.OpenRecordset("Select * From SituacionIVA Where Codigo = " & rsFleteros!CodIVA & "")
    'Printer.Print rsSituacionIVA!Descripcion
    'Set rsSituacionIVA = Nothing
    '.CurrentX = 40: .CurrentY = 92
    'Printer.Print rsFleteros!Localidad
    Set rsDetFactCta = db.OpenRecordset("Select * From DetFactCta Where NroFact = " & NroComp & "")
    LINEAY = 75
    Do While Not rsDetFactCta.EOF
            .CurrentX = 7: .CurrentY = LINEAY
            Printer.Print rsDetFactCta!FechaViaje
            .CurrentX = 28: .CurrentY = LINEAY
            Printer.Print Mid(rsDetFactCta!NroRem, 1, 10)
            .CurrentX = 54: .CurrentY = LINEAY
            Printer.Print Mid(rsDetFactCta!MErcaderia, 1, 13)
            .CurrentX = 76: .CurrentY = LINEAY
            Printer.Print Mid(rsDetFactCta!Procedencia, 1, 13)
            .CurrentX = 108: .CurrentY = LINEAY
            Printer.Print Mid(rsDetFactCta!Destino, 1, 13)
            .CurrentX = 138: .CurrentY = LINEAY
            Printer.Print FormatNumber(rsDetFactCta!Kilos)
            .CurrentX = 158: .CurrentY = LINEAY
            Printer.Print FormatNumber(rsDetFactCta!Tarifa)
            .CurrentX = 179: .CurrentY = LINEAY
            Printer.Print FormatNumber(rsDetFactCta!STotal)
            Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsDetFactCta!CodFlet & "")
            .CurrentX = 197: .CurrentY = LINEAY
            Desc = Mid(rsFleteros!DescFlet, 1, 16)
            Printer.Print Desc
            .CurrentX = 229: Printer.CurrentY = LINEAY
            Printer.Print rsFleteros!CUIT
            .CurrentX = 260: .CurrentY = LINEAY
            Printer.Print "R.I."
            LINEAY = LINEAY + 7
            rsDetFactCta.MoveNext
        Loop
    .CurrentX = 30: .CurrentY = 187
    Printer.Print FormatNumber(rsEncabFactCta!TNeto)
    .CurrentX = 190: .CurrentY = 187
    Printer.Print FormatNumber(rsEncabFactCta!TIVA)
    .CurrentX = 245: .CurrentY = 187
    Printer.Print FormatNumber(rsEncabFactCta!TGRAL)
    .NewPage
Next
.EndDoc
End With
End Sub
Public Sub Imprime_Fact(NroComp, VTipoComp As Long)
Set rsEncabFact = db.OpenRecordset("Select * From EncabFact Where NroFact = " & NroComp & " and TipoFact = " & VTipoComp & "")
Printer.ScaleMode = 6
i = 0
With Printer
For i = i + 1 To 2
    Printer.CurrentX = 155: Printer.CurrentY = 20
    Printer.Print NroComp
    Printer.CurrentX = 155: Printer.CurrentY = 25
    Printer.Print rsEncabFact!Fecha
    If rsEncabFact!tipofact = 2 Then
        Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabFact!Codigo & "")
        .CurrentX = 35: .CurrentY = 50
        Printer.Print rsEncabFact!Codigo & "   " & rsFleteros!DescFlet
        .CurrentX = 130: .CurrentY = 50
        Printer.Print rsFleteros!Direccion
        '.CurrentX = 45: .CurrentY = 60
        'Printer.Print rsEncabFact!Obs
        .CurrentX = 130: .CurrentY = 60
        Printer.Print rsFleteros!Localidad
        .CurrentX = 130: .CurrentY = 70
        Printer.Print rsFleteros!CUIT
        Set rsFleteros = Nothing
        Set rsDetFact = db.OpenRecordset("Select * From DetFact Where NroFact = " & NroComp & "")
        .CurrentX = 35: .CurrentY = 95
        Printer.Print rsDetFact!MErcaderia
        .CurrentX = 180: .CurrentY = 95
        Printer.Print FormatNumber(rsEncabFact!TNeto)
    Else
        Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & rsEncabFact!Codigo & "")
        .CurrentX = 35: .CurrentY = 50
        Printer.Print rsEncabFact!Codigo & "   " & rsEmpresas!DescEmpresas
        .CurrentX = 130: .CurrentY = 50
        Printer.Print rsEmpresas!Direccion
        '.CurrentX = 45: .CurrentY = 60
        'Printer.Print rsEncabFact!Obs
        .CurrentX = 130: .CurrentY = 60
        Printer.Print rsEmpresas!Localidad
        .CurrentX = 130: .CurrentY = 70
        Printer.Print rsEmpresas!CUIT
        Set rsEmpresas = Nothing
        Set rsDetFact = db.OpenRecordset("Select * From DetFact Where NroFact = " & NroComp & " Order By FechaViaje")
        LINEAY = 95
        Do While Not rsDetFact.EOF
            If VTipoComp = 1 Then
                .CurrentX = 8: .CurrentY = LINEAY
                Printer.Print rsDetFact!FechaViaje
                .CurrentX = 30: .CurrentY = LINEAY
                Printer.Print Mid(rsDetFact!NroRem, 1, 10)
                .CurrentX = 45: .CurrentY = LINEAY
                Printer.Print Mid(rsDetFact!MErcaderia, 1, 13)
                .CurrentX = 72: .CurrentY = LINEAY
                Printer.Print Mid(rsDetFact!Procedencia, 1, 13)
                .CurrentX = 100: .CurrentY = LINEAY
                Printer.Print Mid(rsDetFact!Destino, 1, 13)
                .CurrentX = 130: .CurrentY = LINEAY
                Printer.Print FormatNumber(rsDetFact!Kilos)
                .CurrentX = 157: .CurrentY = LINEAY
                Printer.Print FormatNumber(rsDetFact!Tarifa)
                .CurrentX = 180: .CurrentY = LINEAY
                Printer.Print FormatNumber(rsDetFact!STotal)
            Else
                .CurrentX = 45: .CurrentY = LINEAY
                Printer.Print rsDetFact!MErcaderia
                .CurrentX = 180: .CurrentY = LINEAY
                Printer.Print FormatNumber(rsDetFact!STotal)
            End If
            LINEAY = LINEAY + 7
            rsDetFact.MoveNext
        Loop
    End If
    .CurrentX = 15: .CurrentY = 253
    Printer.Print FormatNumber(rsEncabFact!TNeto)
    .CurrentX = 130: .CurrentY = 253
    Printer.Print FormatNumber(rsEncabFact!TIVA)
    .CurrentX = 170: .CurrentY = 253
    Printer.Print FormatNumber(rsEncabFact!TGRAL)
    .NewPage
Next
.EndDoc
End With
End Sub
Public Function ImprimeOP(NroOP As Long)
Dim Derecha As Boolean
i = 0
Printer.PaperSize = 9
Printer.ScaleMode = 6
Printer.Font = Arial
i = 0
Derecha = False
'For I = I + 1 To 2
    'dibuja marco
    Printer.Line (10, 5)-(200, 280), , B
    Printer.Line (105, 5)-(105, 35) 'linea vertical
    Printer.Line (10, 35)-(200, 35)
    Printer.Line (10, 70)-(200, 70)
    'Printer.Line (105, 70)-(105, 270)
    Printer.Line (10, 270)-(200, 270)
    'imprime encabezado
    Set rsEncabOP = db.OpenRecordset("Select * From EncabOP Where NroOP = " & NroOP & "")
    Printer.CurrentX = 15: Printer.CurrentY = 10
    Printer.FontSize = 14: Printer.FontBold = True
    Printer.Print "TRANSPORTE JAVIER MAGGIORI"
    Printer.FontSize = 10: Printer.FontBold = False
    Printer.CurrentX = 115: Printer.CurrentY = 10
    Printer.FontBold = True
    Printer.Print "Orden de Pago"
    Printer.FontBold = False
    Printer.CurrentX = 115: Printer.CurrentY = 15
    Tamaño = Len(rsEncabOP!NroOP)
    Select Case Tamaño
        Case 1: vnro = "0000000" & rsEncabOP!NroOP
        Case 2: vnro = "000000" & rsEncabOP!NroOP
        Case 3: vnro = "00000" & rsEncabOP!NroOP
        Case 4: vnro = "0000" & rsEncabOP!NroOP
        Case 5: vnro = "000" & rsEncabOP!NroOP
        Case 6: vnro = "00" & rsEncabOP!NroOP
        Case 7: vnro = "0" & rsEncabOP!NroOP
        Case 8: vnro = rsEncabOP!NroOP
    End Select
    Printer.Print "Recibo Nro:" & "  0001" & "-" & vnro
    Printer.CurrentX = 115: Printer.CurrentY = 20
    Printer.Print "Fecha:" & "  " & rsEncabOP!Fecha
    Printer.CurrentX = 15: Printer.CurrentY = 45
    Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabOP!CodProv & "")
    Printer.Print "Sres: " & "   " & rsEncabOP!CodProv & "    " & rsFleteros!DescFlet
    Printer.CurrentX = 15: Printer.CurrentY = 55
    Printer.Print "Domicilio: " & rsFleteros!Direccion
    Printer.CurrentX = 115: Printer.CurrentY = 55
    Printer.Print "Localidad: " & rsFleteros!Localidad
    Set rsSituacionIVA = db.OpenRecordset("Select * From SituacionIVA Where Codigo = " & rsFleteros!CodIVA & "")
    Printer.CurrentX = 15: Printer.CurrentY = 65
    Printer.Print "Situación IVA: " & rsFleteros!CodIVA & "   " & rsSituacionIVA!Descripcion
    Set rsSituacionIVA = Nothing
    Printer.CurrentX = 115: Printer.CurrentY = 65
    Printer.Print "CUIT: " & rsFleteros!CUIT
    Set rsFleteros = Nothing
    
    'imprime facturas aplicadas
    
    Set rsAplicOP = db.OpenRecordset("Select * From AplicOP Where NroOP = " & rsEncabOP!NroOP & "")
    Printer.CurrentX = 15: Printer.CurrentY = 75
    Printer.FontBold = True: Printer.FontItalic = True: Printer.FontSize = 14
    Printer.Print "Comprobantes Cancelados"
    Printer.FontBold = False: Printer.FontItalic = False: Printer.FontSize = 10
    LINEAY = 85
    LineaX = 12
    Do While Not rsAplicOP.EOF
        If LINEAY < 270 Then
            
            Printer.CurrentX = LineaX: Printer.CurrentY = LINEAY
            If Not rsAplicOP!NroFact = "" Then
                Tamaño = Len(rsAplicOP!NroFact)
                Select Case Tamaño
                    Case 1: vnro = "0000000" & rsAplicOP!NroFact
                    Case 2: vnro = "000000" & rsAplicOP!NroFact
                    Case 3: vnro = "00000" & rsAplicOP!NroFact
                    Case 4: vnro = "0000" & rsAplicOP!NroFact
                    Case 5: vnro = "000" & rsAplicOP!NroFact
                    Case 6: vnro = "00" & rsAplicOP!NroFact
                    Case 7: vnro = "0" & rsAplicOP!NroFact
                    Case 8: vnro = rsAplicOP!NroFact
                End Select
                Printer.Print "1-" & vnro
                Set rsEncabFactProv = db.OpenRecordset("Select * From EncabFactProv Where CodProv = " & rsEncabOP!CodProv & " And NroFact = " & rsAplicOP!NroFact & "")
                If Not rsEncabFactProv!LIVA = "SI" Then
                    Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabFactProv!CodFlet & "")
                    Printer.CurrentX = LineaX + 24: Printer.CurrentY = LINEAY
                    Printer.Print Mid(rsFleteros!DescFlet, 1, 15)
                End If
                Printer.CurrentX = LineaX + 60: Printer.CurrentY = LINEAY
                Printer.Print FormatCurrency(rsAplicOP!ImpAplic)
            Else
                Printer.Print "A Cuenta"
                Printer.CurrentX = LineaX + 60: Printer.CurrentY = LINEAY
                Printer.Print FormatCurrency(rsAplicOP!ImpAplic)
            End If
            LINEAY = LINEAY + 5
            rsAplicOP.MoveNext
        Else
            If Derecha = False Then
                LINEAY = 85
                LineaX = 107
                Derecha = True
            Else
                Printer.NewPage
                Printer.Line (10, 5)-(200, 280), , B
                Printer.Line (105, 5)-(105, 35) 'linea vertical
                Printer.Line (10, 35)-(200, 35)
                Printer.Line (10, 70)-(200, 70)
                'Printer.Line (105, 70)-(105, 270)
                Printer.Line (10, 270)-(200, 270)
                'imprime encabezado
                Set rsEncabOP = db.OpenRecordset("Select * From EncabOP Where NroOP = " & NroOP & "")
                Printer.CurrentX = 15: Printer.CurrentY = 10
                Printer.FontSize = 14: Printer.FontBold = True
                Printer.Print "TRANSPORTE TRANS-MAGG"
                Printer.FontSize = 10: Printer.FontBold = False
                Printer.CurrentX = 115: Printer.CurrentY = 10
                Printer.FontBold = True
                Printer.Print "Orden de Pago"
                Printer.FontBold = False
                Printer.CurrentX = 115: Printer.CurrentY = 15
                Tamaño = Len(rsEncabOP!NroOP)
                Select Case Tamaño
                    Case 1: vnro = "0000000" & rsEncabOP!NroOP
                    Case 2: vnro = "000000" & rsEncabOP!NroOP
                    Case 3: vnro = "00000" & rsEncabOP!NroOP
                    Case 4: vnro = "0000" & rsEncabOP!NroOP
                    Case 5: vnro = "000" & rsEncabOP!NroOP
                    Case 6: vnro = "00" & rsEncabOP!NroOP
                    Case 7: vnro = "0" & rsEncabOP!NroOP
                    Case 8: vnro = rsEncabOP!NroOP
                End Select
                Printer.Print "Recibo Nro:" & "  0001" & "-" & vnro
                Printer.CurrentX = 115: Printer.CurrentY = 20
                Printer.Print "Fecha:" & "  " & rsEncabOP!Fecha
                Printer.CurrentX = 15: Printer.CurrentY = 45
                Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabOP!CodProv & "")
                Printer.Print "Sres: " & "   " & rsEncabOP!CodProv & "    " & rsFleteros!DescFlet
                Printer.CurrentX = 15: Printer.CurrentY = 55
                Printer.Print "Domicilio: " & rsFleteros!Direccion
                Printer.CurrentX = 115: Printer.CurrentY = 55
                Printer.Print "Localidad: " & rsFleteros!Localidad
                Set rsSituacionIVA = db.OpenRecordset("Select * From SituacionIVA Where Codigo = " & rsFleteros!CodIVA & "")
                Printer.CurrentX = 15: Printer.CurrentY = 65
                Printer.Print "Situación IVA: " & rsFleteros!CodIVA & "   " & rsSituacionIVA!Descripcion
                Set rsSituacionIVA = Nothing
                Printer.CurrentX = 115: Printer.CurrentY = 65
                Printer.Print "CUIT: " & rsFleteros!CUIT
                Set rsFleteros = Nothing
                Printer.CurrentX = 15: Printer.CurrentY = 75
                Printer.FontBold = True: Printer.FontItalic = True: Printer.FontSize = 14
                Printer.Print "Comprobantes Cancelados"
                Printer.FontBold = False: Printer.FontItalic = False: Printer.FontSize = 10
                LINEAY = 85
                Derecha = False
                LineaX = 12
            End If
        End If
    Loop
    Set rsAplicOP = Nothing
    LINEAY = LINEAY + 5
    Printer.CurrentX = LineaX: Printer.CurrentY = LINEAY
    Printer.FontBold = True
    Printer.Print "TOTAL FACT. APLIC."
    Printer.CurrentX = LineaX + 60: Printer.CurrentY = LINEAY
    Printer.Print FormatCurrency(rsEncabOP!TotalOP)
    Printer.FontBold = False
    LINEAY = LINEAY + 5
    'imprime detalle del pago
    'Derecha = False
    'LineaX = 20
    'Printer.Line (10, LINEAY)-(200, LINEAY)
    LINEAY = LINEAY + 5
    Printer.CurrentX = LineaX: Printer.CurrentY = LINEAY
    Printer.FontBold = True: Printer.FontItalic = True: Printer.FontSize = 14
    Printer.Print "Detalle Recibos"
    Printer.FontBold = False: Printer.FontItalic = False: Printer.FontSize = 10
    LINEAY = LINEAY + 5
    If LINEAY < 275 Then
        Printer.CurrentX = LineaX: Printer.CurrentY = LINEAY: Printer.FontUnderline = True
        Printer.Print "Efectivo:"
        Printer.CurrentX = LineaX + 60: Printer.CurrentY = LINEAY: Printer.FontUnderline = False
        Printer.Print FormatCurrency(rsEncabOP!TEfvo)
    Else
        If Derecha = False Then
            LINEAY = 85
            LineaX = 110
            Derecha = True
        Else
            Printer.NewPage
            Printer.Line (10, 5)-(200, 280), , B
            Printer.Line (105, 5)-(105, 35) 'linea vertical
            Printer.Line (10, 35)-(200, 35)
            Printer.Line (10, 70)-(200, 70)
            'Printer.Line (105, 70)-(105, 270)
            Printer.Line (10, 270)-(200, 270)
            'imprime encabezado
            Set rsEncabOP = db.OpenRecordset("Select * From EncabOP Where NroOP = " & NroOP & "")
            Printer.CurrentX = 15: Printer.CurrentY = 10
            Printer.FontSize = 14: Printer.FontBold = True
            Printer.Print "TRANSPORTE TRANS-MAGG"
            Printer.FontSize = 10: Printer.FontBold = False
            Printer.CurrentX = 115: Printer.CurrentY = 10
            Printer.FontBold = True
            Printer.Print "Orden de Pago"
            Printer.FontBold = False
            Printer.CurrentX = 115: Printer.CurrentY = 15
            Tamaño = Len(rsEncabOP!NroOP)
            Select Case Tamaño
                Case 1: vnro = "0000000" & rsEncabOP!NroOP
                Case 2: vnro = "000000" & rsEncabOP!NroOP
                Case 3: vnro = "00000" & rsEncabOP!NroOP
                Case 4: vnro = "0000" & rsEncabOP!NroOP
                Case 5: vnro = "000" & rsEncabOP!NroOP
                Case 6: vnro = "00" & rsEncabOP!NroOP
                Case 7: vnro = "0" & rsEncabOP!NroOP
                Case 8: vnro = rsEncabOP!NroOP
            End Select
            Printer.Print "Recibo Nro:" & "  0001" & "-" & vnro
            Printer.CurrentX = 115: Printer.CurrentY = 20
            Printer.Print "Fecha:" & "  " & rsEncabOP!Fecha
            Printer.CurrentX = 15: Printer.CurrentY = 45
            Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabOP!CodProv & "")
            Printer.Print "Sres: " & "   " & rsEncabOP!CodProv & "    " & rsFleteros!DescFlet
            Printer.CurrentX = 15: Printer.CurrentY = 55
            Printer.Print "Domicilio: " & rsFleteros!Direccion
            Printer.CurrentX = 115: Printer.CurrentY = 55
            Printer.Print "Localidad: " & rsFleteros!Localidad
            Set rsSituacionIVA = db.OpenRecordset("Select * From SituacionIVA Where Codigo = " & rsFleteros!CodIVA & "")
            Printer.CurrentX = 15: Printer.CurrentY = 65
            Printer.Print "Situación IVA: " & rsFleteros!CodIVA & "   " & rsSituacionIVA!Descripcion
            Set rsSituacionIVA = Nothing
            Printer.CurrentX = 115: Printer.CurrentY = 65
            Printer.Print "CUIT: " & rsFleteros!CUIT
            Set rsFleteros = Nothing
            Printer.CurrentX = 15: Printer.CurrentY = 75
            Printer.FontBold = True: Printer.FontItalic = True: Printer.FontSize = 14
            Printer.Print "Detalle Recibos"
            Printer.FontBold = False: Printer.FontItalic = False: Printer.FontSize = 10
            LINEAY = 85
            Derecha = False
            LineaX = 15
            LINEAY = LINEAY + 5
            Printer.CurrentX = LineaX: Printer.CurrentY = LINEAY: Printer.FontUnderline = True
            Printer.Print "Efectivo:"
            Printer.CurrentX = LineaX + 60: Printer.CurrentY = LINEAY: Printer.FontUnderline = False
            Printer.Print FormatCurrency(rsEncabOP!TEfvo)
        End If
    End If
    LINEAY = LINEAY + 5
    If LINEAY < 275 Then
        Printer.CurrentX = LineaX: Printer.CurrentY = LINEAY: Printer.FontUnderline = True
        Printer.Print "Cheques de Terceros"
        Printer.FontUnderline = False
        Set rsDetOPCHT = db.OpenRecordset("Select * From DetOPCHT Where NroOP = " & rsEncabOP!NroOP & "")
        LINEAY = LINEAY + 5
    Else
        If Derecha = False Then
            LINEAY = 85
            LineaX = 110
            Derecha = True
        Else
            Printer.NewPage
            Printer.Line (10, 5)-(200, 280), , B
            Printer.Line (105, 5)-(105, 35) 'linea vertical
            Printer.Line (10, 35)-(200, 35)
            Printer.Line (10, 70)-(200, 70)
            'Printer.Line (105, 70)-(105, 270)
            Printer.Line (10, 270)-(200, 270)
            'imprime encabezado
            Set rsEncabOP = db.OpenRecordset("Select * From EncabOP Where NroOP = " & NroOP & "")
            Printer.CurrentX = 15: Printer.CurrentY = 10
            Printer.FontSize = 14: Printer.FontBold = True
            Printer.Print "TRANSPORTE TRANS-MAGG"
            Printer.FontSize = 10: Printer.FontBold = False
            Printer.CurrentX = 115: Printer.CurrentY = 10
            Printer.FontBold = True
            Printer.Print "Orden de Pago"
            Printer.FontBold = False
            Printer.CurrentX = 115: Printer.CurrentY = 15
            Tamaño = Len(rsEncabOP!NroOP)
            Select Case Tamaño
                Case 1: vnro = "0000000" & rsEncabOP!NroOP
                Case 2: vnro = "000000" & rsEncabOP!NroOP
                Case 3: vnro = "00000" & rsEncabOP!NroOP
                Case 4: vnro = "0000" & rsEncabOP!NroOP
                Case 5: vnro = "000" & rsEncabOP!NroOP
                Case 6: vnro = "00" & rsEncabOP!NroOP
                Case 7: vnro = "0" & rsEncabOP!NroOP
                Case 8: vnro = rsEncabOP!NroOP
            End Select
            Printer.Print "Recibo Nro:" & "  0001" & "-" & vnro
            Printer.CurrentX = 115: Printer.CurrentY = 20
            Printer.Print "Fecha:" & "  " & rsEncabOP!Fecha
            Printer.CurrentX = 15: Printer.CurrentY = 45
            Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabOP!CodProv & "")
            Printer.Print "Sres: " & "   " & rsEncabOP!CodProv & "    " & rsFleteros!DescFlet
            Printer.CurrentX = 15: Printer.CurrentY = 55
            Printer.Print "Domicilio: " & rsFleteros!Direccion
            Printer.CurrentX = 115: Printer.CurrentY = 55
            Printer.Print "Localidad: " & rsFleteros!Localidad
            Set rsSituacionIVA = db.OpenRecordset("Select * From SituacionIVA Where Codigo = " & rsFleteros!CodIVA & "")
            Printer.CurrentX = 15: Printer.CurrentY = 65
            Printer.Print "Situación IVA: " & rsFleteros!CodIVA & "   " & rsSituacionIVA!Descripcion
            Set rsSituacionIVA = Nothing
            Printer.CurrentX = 115: Printer.CurrentY = 65
            Printer.Print "CUIT: " & rsFleteros!CUIT
            Set rsFleteros = Nothing
            Printer.CurrentX = 15: Printer.CurrentY = 75
            Printer.FontBold = True: Printer.FontItalic = True: Printer.FontSize = 14
            Printer.Print "Detalle Recibos"
            Printer.FontBold = False: Printer.FontItalic = False: Printer.FontSize = 10
            LINEAY = 85
            Derecha = False
            LineaX = 20
            Printer.CurrentX = LineaX: Printer.CurrentY = LINEAY: Printer.FontUnderline = True
            Printer.Print "Cheques de Terceros"
            Printer.FontUnderline = False
            Set rsDetOPCHT = db.OpenRecordset("Select * From DetOPCHT Where NroOP = " & rsEncabOP!NroOP & "")
            LINEAY = LINEAY + 5
        End If
    End If
    Do While Not rsDetOPCHT.EOF
        If LINEAY < 275 Then
            Printer.CurrentX = LineaX: Printer.CurrentY = LINEAY
            Set rsBcos = db.OpenRecordset("Select * From Bancos Where CodBco = " & rsDetOPCHT!CodBco & "")
            Printer.Print rsBcos!DescBco
            Set rsBcos = Nothing
            Printer.CurrentX = LineaX + 30: Printer.CurrentY = LINEAY
            Printer.Print rsDetOPCHT!NroCH
            Printer.CurrentX = LineaX + 60: Printer.CurrentY = LINEAY
            Printer.Print FormatCurrency(rsDetOPCHT!Importe)
            LINEAY = LINEAY + 5
            rsDetOPCHT.MoveNext
        Else
            If Derecha = False Then
                LINEAY = 85
                LineaX = 110
                Derecha = True
            Else
                Printer.NewPage
                Printer.Line (10, 5)-(200, 280), , B
                Printer.Line (105, 5)-(105, 35) 'linea vertical
                Printer.Line (10, 35)-(200, 35)
                Printer.Line (10, 70)-(200, 70)
                'Printer.Line (105, 70)-(105, 270)
                Printer.Line (10, 270)-(200, 270)
                'imprime encabezado
                Set rsEncabOP = db.OpenRecordset("Select * From EncabOP Where NroOP = " & NroOP & "")
                Printer.CurrentX = 15: Printer.CurrentY = 10
                Printer.FontSize = 14: Printer.FontBold = True
                Printer.Print "TRANSPORTE TRANS-MAGG"
                Printer.FontSize = 10: Printer.FontBold = False
                Printer.CurrentX = 115: Printer.CurrentY = 10
                Printer.FontBold = True
                Printer.Print "Orden de Pago"
                Printer.FontBold = False
                Printer.CurrentX = 115: Printer.CurrentY = 15
                Tamaño = Len(rsEncabOP!NroOP)
                Select Case Tamaño
                    Case 1: vnro = "0000000" & rsEncabOP!NroOP
                    Case 2: vnro = "000000" & rsEncabOP!NroOP
                    Case 3: vnro = "00000" & rsEncabOP!NroOP
                    Case 4: vnro = "0000" & rsEncabOP!NroOP
                    Case 5: vnro = "000" & rsEncabOP!NroOP
                    Case 6: vnro = "00" & rsEncabOP!NroOP
                    Case 7: vnro = "0" & rsEncabOP!NroOP
                    Case 8: vnro = rsEncabOP!NroOP
                End Select
                Printer.Print "Recibo Nro:" & "  0001" & "-" & vnro
                Printer.CurrentX = 115: Printer.CurrentY = 20
                Printer.Print "Fecha:" & "  " & rsEncabOP!Fecha
                Printer.CurrentX = 15: Printer.CurrentY = 45
                Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabOP!CodProv & "")
                Printer.Print "Sres: " & "   " & rsEncabOP!CodProv & "    " & rsFleteros!DescFlet
                Printer.CurrentX = 15: Printer.CurrentY = 55
                Printer.Print "Domicilio: " & rsFleteros!Direccion
                Printer.CurrentX = 115: Printer.CurrentY = 55
                Printer.Print "Localidad: " & rsFleteros!Localidad
                Set rsSituacionIVA = db.OpenRecordset("Select * From SituacionIVA Where Codigo = " & rsFleteros!CodIVA & "")
                Printer.CurrentX = 15: Printer.CurrentY = 65
                Printer.Print "Situación IVA: " & rsFleteros!CodIVA & "   " & rsSituacionIVA!Descripcion
                Set rsSituacionIVA = Nothing
                Printer.CurrentX = 115: Printer.CurrentY = 65
                Printer.Print "CUIT: " & rsFleteros!CUIT
                Set rsFleteros = Nothing
                Printer.CurrentX = 15: Printer.CurrentY = 75
                Printer.FontBold = True: Printer.FontItalic = True: Printer.FontSize = 14
                Printer.Print "Detalle Recibos"
                Printer.FontBold = False: Printer.FontItalic = False: Printer.FontSize = 10
                LINEAY = 85
                Derecha = False
                LineaX = 15
            End If
        End If
    Loop
    LINEAY = LINEAY + 5
    Printer.CurrentX = LineaX: Printer.CurrentY = LINEAY: Printer.FontUnderline = True
    Printer.Print "Total Cheques de Terceros:"
    Printer.CurrentX = LineaX + 60: Printer.CurrentY = LINEAY: Printer.FontUnderline = False
    Printer.Print FormatCurrency(rsEncabOP!TCHTerceros)
    Set rsdetcht = Nothing
    LINEAY = LINEAY + 5
    If LINEAY < 275 Then
        Printer.CurrentX = LineaX: Printer.CurrentY = LINEAY: Printer.FontUnderline = True
        Printer.Print "Cheques Propios"
        Printer.FontUnderline = False
        Set rsDetOPCHP = db.OpenRecordset("Select * From DetOPCHPropios Where NroOP = " & rsEncabOP!NroOP & "")
        LINEAY = LINEAY + 5
    Else
        If Derecha = False Then
            LINEAY = 85
            LineaX = 110
            Derecha = True
        Else
            Printer.NewPage
            Printer.Line (10, 5)-(200, 280), , B
            Printer.Line (105, 5)-(105, 35) 'linea vertical
            Printer.Line (10, 35)-(200, 35)
            Printer.Line (10, 70)-(200, 70)
            'Printer.Line (105, 70)-(105, 270)
            Printer.Line (10, 270)-(200, 270)
            'imprime encabezado
            Set rsEncabOP = db.OpenRecordset("Select * From EncabOP Where NroOP = " & NroOP & "")
            Printer.CurrentX = 15: Printer.CurrentY = 10
            Printer.FontSize = 14: Printer.FontBold = True
            Printer.Print "TRANSPORTE TRANS-MAGG"
            Printer.FontSize = 10: Printer.FontBold = False
            Printer.CurrentX = 115: Printer.CurrentY = 10
            Printer.FontBold = True
            Printer.Print "Orden de Pago"
            Printer.FontBold = False
            Printer.CurrentX = 115: Printer.CurrentY = 15
            Tamaño = Len(rsEncabOP!NroOP)
            Select Case Tamaño
                Case 1: vnro = "0000000" & rsEncabOP!NroOP
                Case 2: vnro = "000000" & rsEncabOP!NroOP
                Case 3: vnro = "00000" & rsEncabOP!NroOP
                Case 4: vnro = "0000" & rsEncabOP!NroOP
                Case 5: vnro = "000" & rsEncabOP!NroOP
                Case 6: vnro = "00" & rsEncabOP!NroOP
                Case 7: vnro = "0" & rsEncabOP!NroOP
                Case 8: vnro = rsEncabOP!NroOP
            End Select
            Printer.Print "Recibo Nro:" & "  0001" & "-" & vnro
            Printer.CurrentX = 115: Printer.CurrentY = 20
            Printer.Print "Fecha:" & "  " & rsEncabOP!Fecha
            Printer.CurrentX = 15: Printer.CurrentY = 45
            Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabOP!CodProv & "")
            Printer.Print "Sres: " & "   " & rsEncabOP!CodProv & "    " & rsFleteros!DescFlet
            Printer.CurrentX = 15: Printer.CurrentY = 55
            Printer.Print "Domicilio: " & rsFleteros!Direccion
            Printer.CurrentX = 115: Printer.CurrentY = 55
            Printer.Print "Localidad: " & rsFleteros!Localidad
            Set rsSituacionIVA = db.OpenRecordset("Select * From SituacionIVA Where Codigo = " & rsFleteros!CodIVA & "")
            Printer.CurrentX = 15: Printer.CurrentY = 65
            Printer.Print "Situación IVA: " & rsFleteros!CodIVA & "   " & rsSituacionIVA!Descripcion
            Set rsSituacionIVA = Nothing
            Printer.CurrentX = 115: Printer.CurrentY = 65
            Printer.Print "CUIT: " & rsFleteros!CUIT
            Set rsFleteros = Nothing
            Printer.CurrentX = 15: Printer.CurrentY = 75
            Printer.FontBold = True: Printer.FontItalic = True: Printer.FontSize = 14
            Printer.Print "Detalle Recibos"
            Printer.FontBold = False: Printer.FontItalic = False: Printer.FontSize = 10
            LINEAY = 85
            Derecha = False
            LineaX = 15
            Printer.CurrentX = LineaX: Printer.CurrentY = LINEAY: Printer.FontUnderline = True
            Printer.Print "Cheques Propios"
            Printer.FontUnderline = False
            Set rsDetOPCHP = db.OpenRecordset("Select * From DetOPCHPropios Where NroOP = " & rsEncabOP!NroOP & "")
            LINEAY = LINEAY + 5
        End If
    End If
    Do While Not rsDetOPCHP.EOF
        If LINEAY < 275 Then
            Printer.CurrentX = LineaX: Printer.CurrentY = LINEAY
            Set rsCtaBcoPropias = db.OpenRecordset("Select * from CtaCtePropias Where CtaCte = '" & rsDetOPCHP!Cuenta & "'")
            Printer.Print rsCtaBcoPropias!DescBco
            Set rsCtaBcoPropias = Nothing
            Printer.CurrentX = LineaX + 30: Printer.CurrentY = LINEAY
            Printer.Print rsDetOPCHP!NroCH
            Printer.CurrentX = LineaX + 60: Printer.CurrentY = LINEAY
            Printer.Print FormatCurrency(rsDetOPCHP!Importe)
            LINEAY = LINEAY + 5
            rsDetOPCHP.MoveNext
        Else
            If Derecha = False Then
                LINEAY = 85
                LineaX = 110
                Derecha = True
            Else
                Printer.NewPage
                Printer.Line (10, 5)-(200, 280), , B
                Printer.Line (105, 5)-(105, 35) 'linea vertical
                Printer.Line (10, 35)-(200, 35)
                Printer.Line (10, 70)-(200, 70)
                'Printer.Line (105, 70)-(105, 270)
                Printer.Line (10, 270)-(200, 270)
                'imprime encabezado
                Set rsEncabOP = db.OpenRecordset("Select * From EncabOP Where NroOP = " & NroOP & "")
                Printer.CurrentX = 15: Printer.CurrentY = 10
                Printer.FontSize = 14: Printer.FontBold = True
                Printer.Print "TRANSPORTE TRANS-MAGG"
                Printer.FontSize = 10: Printer.FontBold = False
                Printer.CurrentX = 115: Printer.CurrentY = 10
                Printer.FontBold = True
                Printer.Print "Orden de Pago"
                Printer.FontBold = False
                Printer.CurrentX = 115: Printer.CurrentY = 15
                Tamaño = Len(rsEncabOP!NroOP)
                Select Case Tamaño
                    Case 1: vnro = "0000000" & rsEncabOP!NroOP
                    Case 2: vnro = "000000" & rsEncabOP!NroOP
                    Case 3: vnro = "00000" & rsEncabOP!NroOP
                    Case 4: vnro = "0000" & rsEncabOP!NroOP
                    Case 5: vnro = "000" & rsEncabOP!NroOP
                    Case 6: vnro = "00" & rsEncabOP!NroOP
                    Case 7: vnro = "0" & rsEncabOP!NroOP
                    Case 8: vnro = rsEncabOP!NroOP
                End Select
                Printer.Print "Recibo Nro:" & "  0001" & "-" & vnro
                Printer.CurrentX = 115: Printer.CurrentY = 20
                Printer.Print "Fecha:" & "  " & rsEncabOP!Fecha
                Printer.CurrentX = 15: Printer.CurrentY = 45
                Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabOP!CodProv & "")
                Printer.Print "Sres: " & "   " & rsEncabOP!CodProv & "    " & rsFleteros!DescFlet
                Printer.CurrentX = 15: Printer.CurrentY = 55
                Printer.Print "Domicilio: " & rsFleteros!Direccion
                Printer.CurrentX = 115: Printer.CurrentY = 55
                Printer.Print "Localidad: " & rsFleteros!Localidad
                Set rsSituacionIVA = db.OpenRecordset("Select * From SituacionIVA Where Codigo = " & rsFleteros!CodIVA & "")
                Printer.CurrentX = 15: Printer.CurrentY = 65
                Printer.Print "Situación IVA: " & rsFleteros!CodIVA & "   " & rsSituacionIVA!Descripcion
                Set rsSituacionIVA = Nothing
                Printer.CurrentX = 115: Printer.CurrentY = 65
                Printer.Print "CUIT: " & rsFleteros!CUIT
                Set rsFleteros = Nothing
                Printer.CurrentX = 15: Printer.CurrentY = 75
                Printer.FontBold = True: Printer.FontItalic = True: Printer.FontSize = 14
                Printer.Print "Detalle Recibos"
                Printer.FontBold = False: Printer.FontItalic = False: Printer.FontSize = 10
                LINEAY = 85
                Derecha = False
                LineaX = 15
            End If
        End If
    Loop
    Set rsDetOPCHP = Nothing
    LINEAY = LINEAY + 5
    Printer.CurrentX = LineaX: Printer.CurrentY = LINEAY: Printer.FontUnderline = True
    Printer.Print "Total Cheques Propios"
    Printer.CurrentX = LineaX + 60: Printer.CurrentY = LINEAY: Printer.FontUnderline = False
    Printer.Print FormatCurrency(rsEncabOP!TCHPropio)
    Printer.FontBold = True
    LINEAY = LINEAY + 5
    'imprime detalle del recibo
    Printer.CurrentX = LineaX: Printer.CurrentY = LINEAY
    Printer.Print "TOTAL DETALLE"
    Printer.CurrentX = LineaX + 60: Printer.CurrentY = LINEAY
    Printer.Print FormatCurrency(rsEncabOP!TotalOP)
    Printer.FontBold = False
    Printer.NewPage
'Next
Printer.EndDoc

End Function
Public Function ImprimeRec(NroRec As Long)
Dim LINEAY As Double
i = 0
Printer.PaperSize = 9
Printer.ScaleMode = 6
Printer.Font = Arial
i = 0
    'dibuja marco
    Printer.Line (10, 5)-(200, 290), , B
    Printer.Line (105, 5)-(105, 35) 'linea vertical
    Printer.Line (10, 35)-(200, 35)
    Printer.Line (10, 70)-(200, 70)
    Printer.Line (105, 70)-(105, 270)
    Printer.Line (10, 270)-(200, 270)
    'imprime encabezado
    Set rsEncabRec = db.OpenRecordset("Select * From EncabRec Where NroRec = " & NroRec & "")
    Printer.CurrentX = 15: Printer.CurrentY = 10
    Printer.FontSize = 14: Printer.FontBold = True
    Printer.Print "TRANSPORTE JAVIER MAGGIORI"
    Printer.FontSize = 10: Printer.FontBold = False
    Printer.CurrentX = 115: Printer.CurrentY = 10
    Printer.FontBold = True
    Printer.Print "RECIBO POR COBRANZA"
    Printer.FontBold = False
    Printer.CurrentX = 115: Printer.CurrentY = 15
    Tamaño = Len(rsEncabRec!NroRec)
    Select Case Tamaño
        Case 1: vnro = "0000000" & rsEncabRec!NroRec
        Case 2: vnro = "000000" & rsEncabRec!NroRec
        Case 3: vnro = "00000" & rsEncabRec!NroRec
        Case 4: vnro = "0000" & rsEncabRec!NroRec
        Case 5: vnro = "000" & rsEncabRec!NroRec
        Case 6: vnro = "00" & rsEncabRec!NroRec
        Case 7: vnro = "0" & rsEncabRec!NroRec
        Case 8: vnro = rsEncabRec!NroRec
    End Select
    Printer.Print "Recibo Nro:" & "  0001" & "-" & vnro
    Printer.CurrentX = 115: Printer.CurrentY = 20
    Printer.Print "Fecha:" & "  " & rsEncabRec!Fecha
    Printer.CurrentX = 15: Printer.CurrentY = 45
    Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresaS = " & rsEncabRec!CodEmpresa & "")
    Printer.Print "Sres: " & "   " & rsEncabRec!CodEmpresa & "    " & rsEmpresas!DescEmpresas
    Printer.CurrentX = 15: Printer.CurrentY = 55
    Printer.Print "Domicilio: " & rsEmpresas!Direccion
    Printer.CurrentX = 115: Printer.CurrentY = 55
    Printer.Print "Localidad: " & rsEmpresas!Localidad
    Set rsSituacionIVA = db.OpenRecordset("Select * From SituacionIVA Where Codigo = " & rsEmpresas!CodIVA & "")
    Printer.CurrentX = 15: Printer.CurrentY = 65
    Printer.Print "Situación IVA: " & rsEmpresas!CodIVA & "   " & rsSituacionIVA!Descripcion
    Set rsSituacionIVA = Nothing
    Printer.CurrentX = 115: Printer.CurrentY = 65
    Printer.Print "CUIT: " & rsEmpresas!CUIT
    Set rsEmpresas = Nothing
    
    'imprime facturas aplicadas
    Set rsAplicRec = db.OpenRecordset("Select * From AplicRec Where NroRec = " & rsEncabRec!NroRec & "")
    Printer.CurrentX = 15: Printer.CurrentY = 75
    Printer.FontBold = True: Printer.FontItalic = True: Printer.FontSize = 14
    Printer.Print "Comprobantes Cancelados"
    Printer.FontBold = False: Printer.FontItalic = False: Printer.FontSize = 10
    LINEAY = 85
    Do While Not rsAplicRec.EOF
        Printer.CurrentX = 20: Printer.CurrentY = LINEAY
        
        If Not rsAplicRec!NroFact = "" Then
            Set rsEncabFact = db.OpenRecordset("Select * From EncabFact Where NroFact = " & rsAplicRec!NroFact & "")
            Printer.Print rsEncabFact!Fecha
            
            Tamaño = Len(rsAplicRec!NroFact)
            Select Case Tamaño
                Case 1: vnro = "0000000" & rsAplicRec!NroFact
                Case 2: vnro = "000000" & rsAplicRec!NroFact
                Case 3: vnro = "00000" & rsAplicRec!NroFact
                Case 4: vnro = "0000" & rsAplicRec!NroFact
                Case 5: vnro = "000" & rsAplicRec!NroFact
                Case 6: vnro = "00" & rsAplicRec!NroFact
                Case 7: vnro = "0" & rsAplicRec!NroFact
                Case 8: vnro = rsAplicRec!NroFact
            End Select
            Printer.CurrentX = 45: Printer.CurrentY = LINEAY
            Printer.Print "0001-" & vnro
            Printer.CurrentX = 80: Printer.CurrentY = LINEAY
            Printer.Print FormatCurrency(rsAplicRec!ImpAplic)
        Else
            Printer.Print "A Cuenta"
            Printer.CurrentX = 80: Printer.CurrentY = LINEAY
            Printer.Print FormatCurrency(rsAplicRec!ImpAplic)
        End If
        LINEAY = LINEAY + 5
        rsAplicRec.MoveNext
    Loop
    Set rsAplicRec = Nothing
    Printer.CurrentX = 15: Printer.CurrentY = 280
    Printer.FontBold = True
    Printer.Print "TOTAL FACT. APLIC."
    Printer.CurrentX = 80: Printer.CurrentY = 280
    Printer.Print FormatCurrency(rsEncabRec!TotalRec)
    Printer.FontBold = False
    
    'imprime detalle del recibo
    Printer.CurrentX = 115: Printer.CurrentY = 75
    Printer.FontBold = True: Printer.FontItalic = True: Printer.FontSize = 14
    Printer.Print "Detalle Recibos"
    Printer.FontBold = False: Printer.FontItalic = False: Printer.FontSize = 10
    LineaX = 120: LINEAY = 85
    If Not rsEncabRec!TEfvo = 0 Then
        Printer.CurrentX = LineaX: Printer.CurrentY = LINEAY: Printer.FontUnderline = True
        Printer.Print "Efectivo:"
        LineaX = 180
        Printer.CurrentX = LineaX: Printer.CurrentY = LINEAY: Printer.FontUnderline = False
        Printer.Print FormatCurrency(rsEncabRec!TEfvo)
        LINEAY = LINEAY + 5
    End If
    Set rsChTer = db.OpenRecordset("Select * From ChequesTerc Where NroRec = " & rsEncabRec!NroRec & "")
    Printer.FontSize = 8
    If Not rsChTer.EOF Then
        Printer.CurrentX = 120: Printer.CurrentY = LINEAY: Printer.FontUnderline = True
        Printer.Print "Cheques"
        Printer.FontUnderline = False
        LINEAY = LINEAY + 3
        Do While Not rsChTer.EOF
                Printer.CurrentX = 125: Printer.CurrentY = LINEAY
                Set rsBcos = db.OpenRecordset("Select * From Bancos Where CodBco = " & rsChTer!CodBanco & "")
                Printer.Print rsBcos!DescBco
                Set rsBcos = Nothing
                Printer.CurrentX = 150: Printer.CurrentY = LINEAY
                Printer.Print rsChTer!NroCH
                Printer.CurrentX = 180: Printer.CurrentY = LINEAY
                Printer.Print FormatCurrency(rsChTer!Importe)
                LINEAY = LINEAY + 5
                rsChTer.MoveNext
            Loop
            LINEAY = LINEAY + 3
            Printer.CurrentX = 120: Printer.CurrentY = LINEAY: Printer.FontUnderline = True
            Printer.Print "Total Cheques:"
            Printer.CurrentX = 180: Printer.CurrentY = LINEAY: Printer.FontUnderline = False
            Printer.Print FormatCurrency(rsEncabRec!TCheques)
            LINEAY = LINEAY + 10
        End If
    Printer.FontSize = 10
    Set rsRecOtros = db.OpenRecordset("Select * From RecOtros Where NroRec = " & rsEncabRec!NroRec & "")
    If Not rsRecOtros.EOF Then
        Printer.CurrentX = 120: Printer.CurrentY = LINEAY: Printer.FontUnderline = True
        Printer.Print "Otros Conceptos"
        Printer.FontUnderline = False
        LINEAY = LINEAY + 5
        Do While Not rsRecOtros.EOF
            Printer.CurrentX = 125: Printer.CurrentY = LINEAY
            Set rsConcRec = db.OpenRecordset("Select * From ConceptoRec Where CodConcepto = " & rsRecOtros!CodConc & "")
            Printer.Print rsConcRec!descconcepto
            Set rsConcRec = Nothing
            Printer.CurrentX = 180: Printer.CurrentY = LINEAY
            Printer.Print FormatCurrency(rsRecOtros!Importe)
            LINEAY = LINEAY + 5
            rsRecOtros.MoveNext
        Loop
        LINEAY = LINEAY + 5
        Printer.CurrentX = 120: Printer.CurrentY = LINEAY: Printer.FontUnderline = True
        Printer.Print "Total Otros Concepto"
        Printer.CurrentX = 180: Printer.CurrentY = LINEAY: Printer.FontUnderline = False
        Printer.Print FormatCurrency(rsEncabRec!tOtros)
    End If
    
    Printer.CurrentX = 120: Printer.CurrentY = 280
    Printer.FontBold = True
    Printer.Print "TOTAL DETALLE"
    Printer.CurrentX = 180: Printer.CurrentY = 280
    Printer.Print FormatCurrency(rsEncabRec!TotalRec)
    Printer.FontBold = False
Printer.EndDoc
End Function
Public Function EnLetras(numero As String) As String
    Dim b, paso As Integer
    Dim expresion, entero, deci, flag As String
        
    flag = "N"
    For paso = 1 To Len(numero)
        If Mid(numero, paso, 1) = "." Then
            flag = "S"
        Else
            If flag = "N" Then
                entero = entero + Mid(numero, paso, 1) 'Extae la parte entera del numero
            Else
                deci = deci + Mid(numero, paso, 1) 'Extrae la parte decimal del numero
            End If
        End If
    Next paso
    
    If Len(deci) = 1 Then
        deci = deci & "0"
    End If
    
    flag = "N"
    If Val(numero) >= -999999999 And Val(numero) <= 999999999 Then 'si el numero esta dentro de 0 a 999.999.999
        For paso = Len(entero) To 1 Step -1
            b = Len(entero) - (paso - 1)
            Select Case paso
            Case 3, 6, 9
                Select Case Mid(entero, b, 1)
                    Case "1"
                        If Mid(entero, b + 1, 1) = "0" And Mid(entero, b + 2, 1) = "0" Then
                            expresion = expresion & "cien "
                        Else
                            expresion = expresion & "ciento "
                        End If
                    Case "2"
                        expresion = expresion & "doscientos "
                    Case "3"
                        expresion = expresion & "trescientos "
                    Case "4"
                        expresion = expresion & "cuatrocientos "
                    Case "5"
                        expresion = expresion & "quinientos "
                    Case "6"
                        expresion = expresion & "seiscientos "
                    Case "7"
                        expresion = expresion & "setecientos "
                    Case "8"
                        expresion = expresion & "ochocientos "
                    Case "9"
                        expresion = expresion & "novecientos "
                End Select
                
            Case 2, 5, 8
                Select Case Mid(entero, b, 1)
                    Case "1"
                        If Mid(entero, b + 1, 1) = "0" Then
                            flag = "S"
                            expresion = expresion & "diez "
                        End If
                        If Mid(entero, b + 1, 1) = "1" Then
                            flag = "S"
                            expresion = expresion & "once "
                        End If
                        If Mid(entero, b + 1, 1) = "2" Then
                            flag = "S"
                            expresion = expresion & "doce "
                        End If
                        If Mid(entero, b + 1, 1) = "3" Then
                            flag = "S"
                            expresion = expresion & "trece "
                        End If
                        If Mid(entero, b + 1, 1) = "4" Then
                            flag = "S"
                            expresion = expresion & "catorce "
                        End If
                        If Mid(entero, b + 1, 1) = "5" Then
                            flag = "S"
                            expresion = expresion & "quince "
                        End If
                        If Mid(entero, b + 1, 1) > "5" Then
                            flag = "N"
                            expresion = expresion & "dieci"
                        End If
                
                    Case "2"
                        If Mid(entero, b + 1, 1) = "0" Then
                            expresion = expresion & "veinte "
                            flag = "S"
                        Else
                            expresion = expresion & "veinti"
                            flag = "N"
                        End If
                    
                    Case "3"
                        If Mid(entero, b + 1, 1) = "0" Then
                            expresion = expresion & "treinta "
                            flag = "S"
                        Else
                            expresion = expresion & "treinta y "
                            flag = "N"
                        End If
                
                    Case "4"
                        If Mid(entero, b + 1, 1) = "0" Then
                            expresion = expresion & "cuarenta "
                            flag = "S"
                        Else
                            expresion = expresion & "cuarenta y "
                            flag = "N"
                        End If
                
                    Case "5"
                        If Mid(entero, b + 1, 1) = "0" Then
                            expresion = expresion & "cincuenta "
                            flag = "S"
                        Else
                            expresion = expresion & "cincuenta y "
                            flag = "N"
                        End If
                
                    Case "6"
                        If Mid(entero, b + 1, 1) = "0" Then
                            expresion = expresion & "sesenta "
                            flag = "S"
                        Else
                            expresion = expresion & "sesenta y "
                            flag = "N"
                        End If
                
                    Case "7"
                        If Mid(entero, b + 1, 1) = "0" Then
                            expresion = expresion & "setenta "
                            flag = "S"
                        Else
                            expresion = expresion & "setenta y "
                            flag = "N"
                        End If
                
                    Case "8"
                        If Mid(entero, b + 1, 1) = "0" Then
                            expresion = expresion & "ochenta "
                            flag = "S"
                        Else
                            expresion = expresion & "ochenta y "
                            flag = "N"
                        End If
                
                    Case "9"
                        If Mid(entero, b + 1, 1) = "0" Then
                            expresion = expresion & "noventa "
                            flag = "S"
                        Else
                            expresion = expresion & "noventa y "
                            flag = "N"
                        End If
                End Select
                
            Case 1, 4, 7
                Select Case Mid(entero, b, 1)
                    Case "1"
                        If flag = "N" Then
                            If paso = 1 Then
                                expresion = expresion & "uno "
                            Else
                                expresion = expresion & "un "
                            End If
                        End If
                    Case "2"
                        If flag = "N" Then
                            expresion = expresion & "dos "
                        End If
                    Case "3"
                        If flag = "N" Then
                            expresion = expresion & "tres "
                        End If
                    Case "4"
                        If flag = "N" Then
                            expresion = expresion & "cuatro "
                        End If
                    Case "5"
                        If flag = "N" Then
                            expresion = expresion & "cinco "
                        End If
                    Case "6"
                        If flag = "N" Then
                            expresion = expresion & "seis "
                        End If
                    Case "7"
                        If flag = "N" Then
                            expresion = expresion & "siete "
                        End If
                    Case "8"
                        If flag = "N" Then
                            expresion = expresion & "ocho "
                        End If
                    Case "9"
                        If flag = "N" Then
                            expresion = expresion & "nueve "
                        End If
                End Select
            End Select
            If paso = 4 Then
                If Mid(entero, 6, 1) <> "0" Or Mid(entero, 5, 1) <> "0" Or Mid(entero, 4, 1) <> "0" Or _
                  (Mid(entero, 6, 1) = "0" And Mid(entero, 5, 1) = "0" And Mid(entero, 4, 1) = "0" And _
                   Len(entero) <= 6) Then
                    expresion = expresion & "mil "
                End If
            End If
            If paso = 7 Then
                If Len(entero) = 7 And Mid(entero, 1, 1) = "1" Then
                    expresion = expresion & "millón "
                Else
                    expresion = expresion & "millones "
                End If
            End If
        Next paso
        
        If deci <> "" Then
            If Mid(entero, 1, 1) = "-" Then 'si el numero es negativo
                EnLetras = "menos " & expresion & "con " & deci & "/100"
            Else
                EnLetras = expresion & "con " & deci & "/100"
            End If
        Else
            If Mid(entero, 1, 1) = "-" Then 'si el numero es negativo
                EnLetras = "menos " & expresion
            Else
                EnLetras = "Pesos " & expresion
            End If
        End If
    Else 'si el numero a convertir esta fuera del rango superior e inferior
        EnLetras = ""
    End If
End Function
Public Sub MostrarRegistroEmpresas()
    If (Not (rsEmpresas.EOF And rsEmpresas.BOF)) Then
        With ABMEmpresas
        .Text1(0) = rsEmpresas!DescEmpresas
        .Text1(1) = rsEmpresas!Direccion
        .Text1(2) = rsEmpresas!CP
        .Text1(3) = rsEmpresas!Localidad
        .Text1(4) = rsEmpresas!Telefono
        .Text1(5) = rsEmpresas!Email
        .Text1(6) = rsEmpresas!CUIT
        .Combo1.ListIndex = rsEmpresas!CodIVA - 1
        Items = 0
        For Items = Items + 1 To .cmdMover.Count
             .cmdMover(Items - 1).Visible = True
        Next
        End With
    Else
        MsgBox "No hay Coincidencias", vbInformation
        Set rsEmpresas = Nothing
    End If
End Sub
Public Function CodigoEmpresas()
    ' Devuelve una clave única basada en el número de cliente
    With rsEmpresas
    
        ' Si en la tabla ya hay registros, encuentra el último
        ' número de cliente y le suma uno para obtener una clave
        ' que sea única; si no hubiese registros, asigna el valor 1
        
        If (Not (.EOF And .BOF)) Then
            
            .MoveLast
            CodigoEmpresas = .Fields("CodEmpresas") + 1
            
        Else
            
            CodigoEmpresas = 1
        
        End If
        
    End With
End Function
Public Function CodigoProveedor()
    ' Devuelve una clave única basada en el número de cliente
    With rsFleteros
        ' Si en la tabla ya hay registros, encuentra el último
        ' número de cliente y le suma uno para obtener una clave
        ' que sea única; si no hubiese registros, asigna el valor 1
        
        If (Not (.EOF And .BOF)) Then
            
            .MoveLast
            
            CodigoProveedor = .Fields("CodFlet") + 1
            
        Else
            
            CodigoProveedor = 1
        
        End If
        
    End With
End Function

Public Function MostrarProv()
    If (Not (rsFleteros.EOF And rsFleteros.BOF)) Then
        With ABMProveedores
        .Text2(0) = rsFleteros!DescFlet
        .Text2(1) = rsFleteros!Direccion
        .Text2(2) = rsFleteros!CP
        .Text2(3) = rsFleteros!Localidad
        .Text2(4) = rsFleteros!Telefono
        .Text2(6) = rsFleteros!Email
        .Text2(5) = rsFleteros!CUIT
        .Combo2.ListIndex = rsFleteros!CodIVA - 1
        .IIBB.ListIndex = rsFleteros!IIBB - 1
        Items = 0
        For Items = Items + 1 To .cmdMover1.Count
             .cmdMover1(Items - 1).Visible = True
        Next
         End With
    Else
        MsgBox "No hay Coincidencias", vbInformation
    End If
   
End Function
Public Function TableError(oErr As ErrObject) As Boolean
    Dim sMessage As String
    Dim nResponse As Integer
    ' estos son los cuatro códigos de error que se gestionarán especialmente
    ' dentro de esta función
    Const TB_OPEN = 3262            ' tabla ya abierta en modo compartido
    Const TB_IN_USE = 3261          ' tabla ya abierta en modo exclusivo
    Const TB_READ_ONLY = 3027       ' no se puede actualizar, sólo lectura
    Const TB_LOCKED = 3186          ' tabla bloqueada, no se puede actualizar
    Const DB_IN_USE = 3045  ' la base ya está abierta en modo exclusivo
    
    ' De manera predeterminada se asigna False como retorno de la función
    ' que significa que no se quiere volver a intentar
    TableError = False
    
    With oErr
        ' selecciona el código dependiendo del error
        Select Case .Number
            ' la tabla no pudo ser abierta en el modo requerido
            ' se pregunta al usuario si se quiere abrir en modo lectura
            Case TB_OPEN, TB_IN_USE:
                sMessage = "No puede agregar un registro porque la " _
                         & "BD está bloqueada por otro usuario. "
                'Exit Function
            ' la tabla es sólo lectura y no se pueden agregar registros
            Case TB_READ_ONLY:
                sMessage = "No puede agregar un registro porque la " _
                         & "BD está abierta de sólo lectura. "
                         
            ' la tabla está bloqueada y no se pueden agregar registros
            Case TB_LOCKED:
                sMessage = "No puede agregar un registro porque la " _
                         & "BD está bloqueada por otro usuario. "
            ' otro tipo de error: se visualiza el número y la descripción
            Case DB_IN_USE
                SMSSAGE = "ABIERTA EN FORMA ESCLUSIVA POR OTRO USUARIO"
            ' del error
            Case Else
                sMessage = "Error #" & .Number & ": " & .Description
        End Select
    End With
    ' visualiza el mensaje de error
    MsgBox sMessage, vbExclamation, "TABLA ERROR"
    
    ' ha habido un error y nos aseguramos que la tabla queda cerrada
    ' y en la pantalla quedan las etiquetas adecuadas
    'Set rs = Nothing
End Function
Public Sub RImprime_Fact(NroComp As Long)
Set rsEncabFact = db.OpenRecordset("Select * From EncabFact Where NroFact = " & NroComp & "")
Printer.ScaleMode = 6
i = 0
With Printer
    Printer.CurrentX = 155: Printer.CurrentY = 20
    Printer.Print NroComp
    Printer.CurrentX = 155: Printer.CurrentY = 25
    Printer.Print rsEncabFact!Fecha
    If rsEncabFact!tipofact = 2 Then
        Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabFact!Codigo & "")
        .CurrentX = 35: .CurrentY = 50
        Printer.Print rsEncabFact!Codigo & "   " & rsFleteros!DescFlet
        .CurrentX = 130: .CurrentY = 50
        Printer.Print rsFleteros!Direccion
        '.CurrentX = 45: .CurrentY = 60
        'Printer.Print rsEncabFact!Obs
        .CurrentX = 130: .CurrentY = 60
        Printer.Print rsFleteros!Localidad
        .CurrentX = 130: .CurrentY = 70
        Printer.Print rsFleteros!CUIT
        Set rsFleteros = Nothing
        Set rsDetFact = db.OpenRecordset("Select * From DetFact Where NroFact = " & NroComp & "")
        .CurrentX = 35: .CurrentY = 95
        Printer.Print rsDetFact!MErcaderia
        .CurrentX = 180: .CurrentY = 95
        Printer.Print FormatNumber(rsEncabFact!TNeto)
    Else
        Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & rsEncabFact!Codigo & "")
        .CurrentX = 35: .CurrentY = 50
        Printer.Print rsEncabFact!Codigo & "   " & rsEmpresas!DescEmpresas
        .CurrentX = 130: .CurrentY = 50
        Printer.Print rsEmpresas!Direccion
        '.CurrentX = 45: .CurrentY = 60
        'Printer.Print rsEncabFact!Obs
        .CurrentX = 130: .CurrentY = 60
        Printer.Print rsEmpresas!Localidad
        .CurrentX = 130: .CurrentY = 70
        Printer.Print rsEmpresas!CUIT
        Set rsEmpresas = Nothing
        Set rsDetFact = db.OpenRecordset("Select * From DetFact Where NroFact = " & NroComp & " Order By FechaViaje")
        LINEAY = 95
        Do While Not rsDetFact.EOF
            .CurrentX = 8: .CurrentY = LINEAY
            Printer.Print rsDetFact!FechaViaje
            .CurrentX = 30: .CurrentY = LINEAY
            Printer.Print Mid(rsDetFact!NroRem, 1, 10)
            .CurrentX = 45: .CurrentY = LINEAY
            Printer.Print Mid(rsDetFact!MErcaderia, 1, 13)
            .CurrentX = 72: .CurrentY = LINEAY
            Printer.Print Mid(rsDetFact!Procedencia, 1, 13)
            .CurrentX = 100: .CurrentY = LINEAY
            Printer.Print Mid(rsDetFact!Destino, 1, 13)
            .CurrentX = 130: .CurrentY = LINEAY
            Printer.Print FormatNumber(rsDetFact!Kilos)
            .CurrentX = 157: .CurrentY = LINEAY
            Printer.Print FormatNumber(rsDetFact!Tarifa)
            .CurrentX = 180: .CurrentY = LINEAY
            Printer.Print FormatNumber(rsDetFact!STotal)
            LINEAY = LINEAY + 7
            rsDetFact.MoveNext
        Loop
    End If
    .CurrentX = 15: .CurrentY = 250
    Printer.Print FormatNumber(rsEncabFact!TNeto)
    .CurrentX = 130: .CurrentY = 250
    Printer.Print FormatNumber(rsEncabFact!TIVA)
    .CurrentX = 170: .CurrentY = 250
    Printer.Print FormatNumber(rsEncabFact!TGRAL)
.EndDoc
End With
End Sub


