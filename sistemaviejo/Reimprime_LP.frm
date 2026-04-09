VERSION 5.00
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "kewlbuttonz.ocx"
Begin VB.Form Reimprime_LP 
   Caption         =   "Reimprime Liquido Producto"
   ClientHeight    =   1665
   ClientLeft      =   120
   ClientTop       =   450
   ClientWidth     =   4560
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   1665
   ScaleWidth      =   4560
   Begin VB.TextBox NroFact 
      Height          =   285
      Left            =   1800
      TabIndex        =   0
      Top             =   240
      Width           =   1335
   End
   Begin KewlButtonz.KewlButtons Opcion 
      Height          =   495
      Index           =   1
      Left            =   1320
      TabIndex        =   1
      Top             =   720
      Width           =   1575
      _ExtentX        =   2778
      _ExtentY        =   873
      BTYPE           =   1
      TX              =   "Visualizar"
      ENAB            =   -1  'True
      BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      COLTYPE         =   2
      FOCUSR          =   -1  'True
      BCOL            =   4210752
      BCOLO           =   4210752
      FCOL            =   12632256
      FCOLO           =   4210752
      MCOL            =   4210752
      MPTR            =   1
      MICON           =   "Reimprime_LP.frx":0000
      PICN            =   "Reimprime_LP.frx":001C
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin VB.Label Etiqueta 
      BackColor       =   &H00FFFFFF&
      Caption         =   "Ingrese Nro"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   255
      Index           =   0
      Left            =   360
      TabIndex        =   2
      Top             =   240
      Width           =   1215
   End
End
Attribute VB_Name = "Reimprime_LP"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False

Private Sub Opcion_Click(Index As Integer)
    Set rsEncab_LP = db.OpenRecordset("Select * From EncabLProd Where NroComp = " & NroFact & "")
    Set rsDet_LP = db.OpenRecordset("Select * from DetViajesLP Where NroComp = " & NroFact & "")
    Set TrsEncabFact = dbTemp.OpenRecordset("EncabFact")
    Set TrsDetFact = dbTemp.OpenRecordset("DetFact")
    'limpia temporales
    Do While Not TrsEncabFact.EOF
        TrsEncabFact.Delete
        TrsEncabFact.MoveNext
    Loop
    Do While Not TrsDetFact.EOF
        TrsDetFact.Delete
        TrsDetFact.MoveNext
    Loop
    Set rsFleteros = db.OpenRecordset("SELECT * FROM Fleteros WHERE Codflet = " & rsEncab_LP!Codflet & "")
        
        With TrsEncabFact
        .AddNew
        VNro = rsEncab_LP!NroComp
        largo = Len(VNro)
        Select Case largo
            Case 1: NRO = "0000000" & VNro
            Case 2: NRO = "000000" & VNro
            Case 3: NRO = "00000" & VNro
            Case 4: NRO = "0000" & VNro
            Case 5: NRO = "000" & VNro
            Case 6: NRO = "00" & VNro
            Case 7: NRO = "0" & VNro
            Case 8: NRO = VNro
        End Select
        .Fields("NroFact") = VNro
        .Fields("Fecha") = rsEncab_LP!Fecha
        .Fields("Codigo") = rsEncab_LP!Codflet
        Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncab_LP!Codflet & "")
        .Fields("DescClie") = rsFleteros!DescFlet
        .Fields("DirClie") = rsFleteros!Direccion
        .Fields("LocCLie") = rsFleteros!Localidad
        .Fields("CuitClie") = rsFleteros!cuit
        '.Fields("TipoFact") = 1 '1 - Factura Viajes, 2- Factura de Comisión
        .Fields("NetoViajes") = rsEncab_LP!TotalViajes
        .Fields("NetoComis") = rsEncab_LP!netocomis
        .Fields("TNeto") = rsEncab_LP!netoviajes
        .Fields("TIVA") = rsEncab_LP!ivaviaje
        .Fields("TGral") = rsEncab_LP!totalviajeS1
        .Fields("CAE") = rsEncab_LP!cae
        .Fields("ObsCAE") = rsEncab_LP!obscae
        DIA = Mid(rsEncab_LP!FVto, 7, 2)
        MES = Mid(rsEncab_LP!FVto, 5, 2)
        AÑO = Mid(rsEncab_LP!FVto, 1, 4)
        FVTOCAE = DIA & "/" & MES & "/" & AÑO
        .Fields("VtoCAE") = FVTOCAE
        '.Fields("MotivoCAE") = rsEncab_LP!motivocae
        .Fields("NroFE") = NRO
        .Fields("PtoVtaFE") = "0004"
        .Fields("QR") = rsEncab_LP!qr
        .Update
        End With

        ''' GRABA DETALLE '''
        Do While Not rsDet_LP.EOF
                       
            With TrsDetFact
            .AddNew
            .Fields("NroFact") = VNro
            .Fields("FechaViaje") = rsDet_LP!FechaViaje
            .Fields("NroRem") = rsDet_LP!rEMITO
            .Fields("Mercaderia") = rsDet_LP!mERCADERIA
            .Fields("Procedencia") = rsDet_LP!pROCEDENCIA
            .Fields("Destino") = rsDet_LP!dESTINO
            .Fields("Kilos") = rsDet_LP!kilos
            .Fields("Tarifa") = rsDet_LP!tarifa
            .Fields("STotal") = rsDet_LP!sUBTOTAL
            .Update

            
            End With
            rsDet_LP.MoveNext
        Loop
            
        Dim frmRep As New InfFactLiqProd
        
        frmRep.Show vbModal

End Sub
