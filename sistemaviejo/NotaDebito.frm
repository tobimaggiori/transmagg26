VERSION 5.00
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "KewlButtonz.ocx"
Object = "{C932BA88-4374-101B-A56C-00AA003668DC}#1.1#0"; "MSMASK32.OCX"
Object = "{FF19AA0C-2968-41B8-A906-E80997A9C394}#202.0#0"; "WSAFIPFEOCX.ocx"
Begin VB.Form NotaDebito 
   BackColor       =   &H80000007&
   Caption         =   "Nota de Debito"
   ClientHeight    =   5760
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   7980
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   5760
   ScaleWidth      =   7980
   Begin VB.Frame InfAdi 
      BackColor       =   &H80000007&
      Caption         =   "Aplicar a Factura"
      ForeColor       =   &H0080C0FF&
      Height          =   1695
      Left            =   120
      TabIndex        =   26
      Top             =   3840
      Width           =   3615
      Begin VB.TextBox Text1 
         BeginProperty DataFormat 
            Type            =   1
            Format          =   "dd/MM/yyyy"
            HaveTrueFalseNull=   0
            FirstDayOfWeek  =   0
            FirstWeekOfYear =   0
            LCID            =   11274
            SubFormatType   =   3
         EndProperty
         Height          =   285
         Index           =   13
         Left            =   1440
         TabIndex        =   34
         Text            =   "Text1"
         Top             =   360
         Width           =   2055
      End
      Begin VB.TextBox Text1 
         BeginProperty DataFormat 
            Type            =   1
            Format          =   "dd/MM/yyyy"
            HaveTrueFalseNull=   0
            FirstDayOfWeek  =   0
            FirstWeekOfYear =   0
            LCID            =   11274
            SubFormatType   =   3
         EndProperty
         Height          =   285
         Index           =   12
         Left            =   720
         TabIndex        =   33
         Text            =   "Text1"
         Top             =   360
         Width           =   615
      End
      Begin VB.TextBox Text1 
         BeginProperty DataFormat 
            Type            =   1
            Format          =   "dd/MM/yyyy"
            HaveTrueFalseNull=   0
            FirstDayOfWeek  =   0
            FirstWeekOfYear =   0
            LCID            =   11274
            SubFormatType   =   3
         EndProperty
         Height          =   285
         Index           =   11
         Left            =   1680
         TabIndex        =   29
         Text            =   "Text1"
         Top             =   1080
         Width           =   1335
      End
      Begin VB.TextBox Text1 
         BeginProperty DataFormat 
            Type            =   1
            Format          =   "dd/MM/yyyy"
            HaveTrueFalseNull=   0
            FirstDayOfWeek  =   0
            FirstWeekOfYear =   0
            LCID            =   11274
            SubFormatType   =   3
         EndProperty
         Height          =   285
         Index           =   10
         Left            =   2400
         TabIndex        =   28
         Text            =   "Text1"
         Top             =   720
         Width           =   1095
      End
      Begin VB.TextBox Text1 
         BeginProperty DataFormat 
            Type            =   1
            Format          =   "dd/MM/yyyy"
            HaveTrueFalseNull=   0
            FirstDayOfWeek  =   0
            FirstWeekOfYear =   0
            LCID            =   11274
            SubFormatType   =   3
         EndProperty
         Height          =   285
         Index           =   9
         Left            =   1680
         TabIndex        =   27
         Text            =   "Text1"
         Top             =   720
         Width           =   615
      End
      Begin VB.Label Label1 
         Appearance      =   0  'Flat
         BackColor       =   &H80000001&
         Caption         =   "Comp"
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
         Index           =   11
         Left            =   120
         TabIndex        =   32
         Top             =   360
         Width           =   1575
      End
      Begin VB.Label Label1 
         BackColor       =   &H00000000&
         Caption         =   "Fecha"
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
         Index           =   10
         Left            =   120
         TabIndex        =   31
         Top             =   1080
         Width           =   1575
      End
      Begin VB.Label Label1 
         Appearance      =   0  'Flat
         BackColor       =   &H80000001&
         Caption         =   "Aplicar a Factura"
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
         Index           =   9
         Left            =   120
         TabIndex        =   30
         Top             =   720
         Width           =   1575
      End
   End
   Begin VB.OptionButton Option1 
      Caption         =   "Empresa"
      Height          =   195
      Index           =   0
      Left            =   6480
      TabIndex        =   25
      Top             =   120
      Width           =   1215
   End
   Begin VB.OptionButton Option1 
      Caption         =   "Fletero"
      Height          =   195
      Index           =   1
      Left            =   6480
      TabIndex        =   24
      Top             =   480
      Width           =   1215
   End
   Begin WSAFIPFEOCX.WSAFIPFEx NDE 
      Left            =   6480
      Top             =   4200
      _ExtentX        =   1508
      _ExtentY        =   661
   End
   Begin VB.ComboBox TipoComp 
      Height          =   315
      Left            =   1320
      TabIndex        =   11
      Top             =   0
      Width           =   1935
   End
   Begin VB.TextBox Text1 
      BeginProperty DataFormat 
         Type            =   1
         Format          =   "dd/MM/yyyy"
         HaveTrueFalseNull=   0
         FirstDayOfWeek  =   0
         FirstWeekOfYear =   0
         LCID            =   11274
         SubFormatType   =   3
      EndProperty
      Height          =   285
      Index           =   0
      Left            =   2520
      TabIndex        =   10
      Text            =   "Text1"
      Top             =   840
      Visible         =   0   'False
      Width           =   1455
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   1
      Left            =   1320
      TabIndex        =   9
      Text            =   "Text1"
      Top             =   480
      Width           =   855
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   2
      Left            =   2280
      TabIndex        =   8
      Text            =   "Text1"
      Top             =   480
      Width           =   3615
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   3
      Left            =   120
      TabIndex        =   7
      Text            =   "Text1"
      Top             =   1320
      Width           =   3615
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   4
      Left            =   3840
      TabIndex        =   6
      Text            =   "Text1"
      Top             =   1320
      Width           =   855
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   5
      Left            =   4800
      TabIndex        =   5
      Text            =   "Text1"
      Top             =   1320
      Width           =   1215
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   6
      Left            =   5040
      TabIndex        =   3
      Text            =   "Text1"
      Top             =   3840
      Width           =   1215
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   7
      Left            =   5040
      TabIndex        =   2
      Text            =   "Text1"
      Top             =   4200
      Width           =   1215
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   8
      Left            =   5040
      TabIndex        =   1
      Text            =   "Text1"
      Top             =   4560
      Width           =   1215
   End
   Begin MSMask.MaskEdBox FechaNC 
      Height          =   285
      Left            =   4560
      TabIndex        =   0
      Top             =   0
      Width           =   1335
      _ExtentX        =   2355
      _ExtentY        =   503
      _Version        =   393216
      PromptChar      =   "_"
   End
   Begin MSComctlLib.ListView CuerpoNC 
      Height          =   1935
      Left            =   120
      TabIndex        =   4
      Top             =   1800
      Width           =   6135
      _ExtentX        =   10821
      _ExtentY        =   3413
      View            =   3
      LabelWrap       =   0   'False
      HideSelection   =   0   'False
      FullRowSelect   =   -1  'True
      GridLines       =   -1  'True
      _Version        =   393217
      ForeColor       =   -2147483640
      BackColor       =   -2147483643
      BorderStyle     =   1
      Appearance      =   1
      NumItems        =   3
      BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         Text            =   "Descripcion"
         Object.Width           =   5644
      EndProperty
      BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   1
         Text            =   "IVA"
         Object.Width           =   2540
      EndProperty
      BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   2
         Text            =   "SubTotal"
         Object.Width           =   2540
      EndProperty
   End
   Begin KewlButtonz.KewlButtons AgregarCHP 
      Height          =   375
      Left            =   6120
      TabIndex        =   21
      Top             =   1320
      Width           =   1575
      _ExtentX        =   2778
      _ExtentY        =   661
      BTYPE           =   1
      TX              =   "Agregar"
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
      FCOL            =   14737632
      FCOLO           =   16777215
      MCOL            =   4210752
      MPTR            =   1
      MICON           =   "NotaDebito.frx":0000
      PICN            =   "NotaDebito.frx":001C
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin KewlButtonz.KewlButtons Aceptar 
      Height          =   495
      Left            =   4200
      TabIndex        =   22
      Top             =   5040
      Width           =   1335
      _ExtentX        =   2355
      _ExtentY        =   873
      BTYPE           =   1
      TX              =   "Grabar"
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
      FCOL            =   14737632
      FCOLO           =   16777215
      MCOL            =   4210752
      MPTR            =   1
      MICON           =   "NotaDebito.frx":209E
      PICN            =   "NotaDebito.frx":20BA
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin KewlButtonz.KewlButtons Cancelar 
      Height          =   495
      Left            =   6000
      TabIndex        =   23
      Top             =   5040
      Width           =   1335
      _ExtentX        =   2355
      _ExtentY        =   873
      BTYPE           =   1
      TX              =   "Cancelar"
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
      MICON           =   "NotaDebito.frx":413C
      PICN            =   "NotaDebito.frx":4158
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Tipo de ND:"
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
      Left            =   0
      TabIndex        =   20
      Top             =   0
      Width           =   1335
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Fecha:"
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
      Index           =   1
      Left            =   3360
      TabIndex        =   19
      Top             =   0
      Width           =   1335
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Cliente:"
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
      Index           =   2
      Left            =   0
      TabIndex        =   18
      Top             =   480
      Width           =   1335
   End
   Begin VB.Label Label1 
      Alignment       =   2  'Center
      BackColor       =   &H00000000&
      Caption         =   "Descripcion"
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
      Index           =   3
      Left            =   120
      TabIndex        =   17
      Top             =   960
      Width           =   3615
   End
   Begin VB.Label Label1 
      Alignment       =   2  'Center
      BackColor       =   &H00000000&
      Caption         =   "Por IVA"
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
      Index           =   4
      Left            =   3720
      TabIndex        =   16
      Top             =   960
      Width           =   1215
   End
   Begin VB.Label Label1 
      Alignment       =   2  'Center
      BackColor       =   &H00000000&
      Caption         =   "Neto"
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
      Index           =   5
      Left            =   4800
      TabIndex        =   15
      Top             =   960
      Width           =   1335
   End
   Begin VB.Label Label1 
      Alignment       =   2  'Center
      BackColor       =   &H00000000&
      Caption         =   "SubTotal"
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
      Index           =   6
      Left            =   3600
      TabIndex        =   14
      Top             =   3840
      Width           =   1335
   End
   Begin VB.Label Label1 
      Alignment       =   2  'Center
      BackColor       =   &H00000000&
      Caption         =   "IVA"
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
      Index           =   7
      Left            =   3600
      TabIndex        =   13
      Top             =   4200
      Width           =   1335
   End
   Begin VB.Label Label1 
      Alignment       =   2  'Center
      BackColor       =   &H00000000&
      Caption         =   "Total"
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
      Index           =   8
      Left            =   3720
      TabIndex        =   12
      Top             =   4560
      Width           =   1335
   End
End
Attribute VB_Name = "NotaDebito"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private TNC As Double, TIVA As Double, TNeto As Double
Private Cuerpo As ListItem
Dim UltNro As String, FVto As String, FServD As String, FservH As String, FPago As String, VNetoFE As Double
Dim VivaFE As Double, FCte As String, VCUIT As String, VTipoDoc As Single, VIndice As Long, VtipoComp, VTipoComp1
Dim VCAE As String, VMOTIVO As String, VProceso As String, VNro As String
Private Function GetPrimaryKey()
    ' Devuelve una clave única basada en el número de cliente
    With rsEncabFact
        ' Si en la tabla ya hay registros, encuentra el último
        ' número de cliente y le suma uno para obtener una clave
        ' que sea única; si no hubiese registros, asigna el valor 1
        If (Not (.EOF And .BOF)) Then
            
            .MoveLast
            
            GetPrimaryKey = .Fields("NroFact") + 1
            
        Else
            
            GetPrimaryKey = 1
        
        End If
        
    End With
End Function
Private Function GetPrimaryKeyCta()
    ' Devuelve una clave única basada en el número de cliente
    With rsEncabFactCta
        ' Si en la tabla ya hay registros, encuentra el último
        ' número de cliente y le suma uno para obtener una clave
        ' que sea única; si no hubiese registros, asigna el valor 1
        If (Not (.EOF And .BOF)) Then
            
            .MoveLast
            
            GetPrimaryKeyCta = .Fields("NroFact") + 1
            
        Else
            
            GetPrimaryKeyCta = 1
        
        End If
        
    End With
End Function

Private Sub Aceptar_Click()
Dim lPrimaryKey As Long
If TipoComp.ListIndex = 1 Then
    Call GENERA_ND1
End If
If TipoComp.ListIndex = 0 Then
    Call GENERA_ND1
     'Dim frmRep As New InfND_E
            
    'frmRep.Show vbModal
    
End If
Call Form_Load
End Sub
Private Sub CAE_ND()
If NDE.iniciar(modoFiscal_Fiscal, "30709381683", App.Path + "\Certificado\Certificado.pfx", App.Path + "\Certificado\WSAFIPFE.lic") Then
   Me.NDE.ArchivoCertificadoPassword = "hercasa1509"
   If NDE.f1ObtenerTicketAcceso() Then
      NDE.F1CabeceraCantReg = 1
      NDE.F1CabeceraPtoVta = 4
      NDE.F1CabeceraCbteTipo = VTipoComp1
      
      NDE.f1Indice = 0
      NDE.F1DetalleConcepto = 2
      NDE.F1DetalleDocTipo = VTipoDoc
      NDE.F1DetalleDocNro = VCUIT
      NDE.F1DetalleCbteDesde = VNro
      NDE.F1DetalleCbteHasta = VNro
      NDE.F1DetalleCbteFch = FCte
      NDE.F1DetalleImpTotal = FormatNumber(TNC)
      NDE.F1DetalleImpTotalConc = 0
      NDE.F1DetalleImpNeto = FormatNumber(TNeto)
      NDE.F1DetalleImpOpEx = 0
      NDE.F1DetalleImpTrib = 0
      NDE.F1DetalleImpIva = FormatNumber(TIVA)
      NDE.F1DetalleFchServDesde = FServD
      NDE.F1DetalleFchServHasta = FservH
      NDE.F1DetalleFchVtoPago = FPago
      NDE.F1DetalleMonIdS = "PES"
      NDE.F1DetalleMonCotiz = 1
      NDE.F1DetalleIvaItemCantidad = 1
      NDE.f1IndiceItem = 0
      If TIVA = 0 Then
            NDE.F1DetalleIvaId = 3
            NDE.F1DetalleIvaBaseImp = FormatNumber(TNeto)
            NDE.F1DetalleIvaImporte = FormatNumber(TIVA)
     Else
            NDE.F1DetalleIvaId = 5
            NDE.F1DetalleIvaBaseImp = FormatNumber(TNeto)
            NDE.F1DetalleIvaImporte = FormatNumber(TIVA)
    End If

      'NDE.F1DetalleTributoItemCantidad = 1
      'NDE.f1IndiceItem = 0
      'NDE.F1DetalleTributoId = 3
      'NDE.F1DetalleTributoDesc = ""
      'NDE.F1DetalleTributoBaseImp = 0
      'NDE.F1DetalleTributoAlic = 0
      'NDE.F1DetalleTributoImporte = 0

      'NDE.f1IndiceItem = 1
      'NDE.F1DetalleIvaId = 4
      'NDE.F1DetalleIvaBaseImp = 0
      'NDE.F1DetalleIvaImporte = 0+
    NDE.F1DetalleCbtesAsocItemCantidad = 1
    NDE.f1IndiceItem = 0
    NDE.F1DetalleCbtesAsocTipo = 1
    NDE.F1DetalleCbtesAsocPtoVta = Text1(9)
    NDE.F1DetalleCbtesAsocNroS = Text1(10)


      'NDE.F1DetalleCbtesAsocItemCantidad = 0
      'NDE.F1DetalleOpcionalItemCantidad = 0

    NDE.ArchivoXMLRecibido = App.Path & "\XML\recibido.xml"
    NDE.ArchivoXMLEnviado = App.Path & "\XML\enviado.xml"

      lResultado = NDE.F1CAESolicitar()
    NDE.F1CabeceraCantReg = 1
    NDE.F1CabeceraPtoVta = 4
    NDE.F1CabeceraCbteTipo = VtipoComp
    NDE.f1Indice = 0
    NDE.qrVersion = 1
    NDE.F1DetalleConcepto = 1
                NDE.F1DetalleDocTipo = 80
                NDE.F1DetalleDocNro = VCUIT
                NDE.F1DetalleCbteDesdeS = NroQR
                NDE.F1DetalleCbteFch = FCte
                i = Len(FormatNumber(TNC))
                For A = i To 1 Step -1
                    DIGITO = Mid(FormatNumber(TNC), A, 1)
                    If Not DIGITO = "." Then
                        VTOTAL = DIGITO & VTOTAL
                    End If
                Next
                NDE.F1DetalleImpTotal = VTOTAL
                NDE.F1DetalleMonId = "PES"
                NDE.F1DetalleMonCotiz = 1
                NDE.F1Detalleqrtipocodigo = "E"
                Rem  fe.F1Detalleqrtipocodigo = "A" si es un CAE anticipado
                NDE.F1DetalleCAEA = 1
                NDE.F1DetalleQRArchivo = App.Path + "\QR\qr" & VTipoComp1 & "_4_" & NroQR & ".jpg"
                NDE.f1detalleqrtolerancia = 1
                NDE.f1detalleqrresolucion = 4
                NDE.f1detalleqrformato = 6
                If NDE.f1qrGenerar(99) Then
                    'MsgBox ("gráfico generado con los datos. " + FE.f1qrmanualTexto)
                Else
                    MsgBox ("error al generar imagen " + NDE.ArchivoQRError + " " + NDE.UltimoMensajeError)
                End If
      
     If lResultado Then
         MsgBox ("NOTA DE DEBITO Generada")
      Else
         MsgBox ("Error de Solicitud de CAE")
      End If
      'MsgBox ("error local: " + NDE.UltimoMensajeError)
      'MsgBox ("resultado global AFIP: " + NDE.F1RespuestaResultado)
      'MsgBox ("es reproceso? " + NDE.F1RespuestaReProceso)
      'MsgBox ("registros procesados por AFIP: " + Str(NDE.F1RespuestaCantidadReg))
      'MsgBox ("error genérico global:" + NDE.f1ErrorMsg1)
      If NDE.F1RespuestaCantidadReg > 0 Then
        'NDE.f1Indice = 0
        'MsgBox ("resultado detallado comprobante: " + NDE.F1RespuestaDetalleResultado)
        'MsgBox ("cae comprobante: " + NDE.F1RespuestaDetalleCae)
        'MsgBox ("número comprobante:" + NDE.F1RespuestaDetalleCbteDesdeS)
        'MsgBox ("error detallado comprobante: " + NDE.F1RespuestaDetalleObservacionMsg1)
        Exit Sub
      End If
   Else
      MsgBox ("fallo acceso " + NDE.UltimoMensajeError)
   End If
Else
   MsgBox ("fallo iniciar " + NDE.UltimoMensajeError)
End If

End Sub
Private Sub GENERA_ND1()
On Error Resume Next
    If TipoComp.ListIndex = 0 Then
        VtipoComp = 18
        VTipoComp1 = 2
    Else
        VtipoComp = 37
    End If
    Set rsEncabFact = db.OpenRecordset("Select * from EncabFE Where TipoSistema = " & VtipoComp & " order by NroFe")
    Set rsDetFact = db.OpenRecordset("DetFE")
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
    'busca número nota de credito
    If Not rsEncabFact.EOF Then
        rsEncabFact.MoveLast
        lPrimaryKey = rsEncabFact.Fields("NroFE") + 1
    Else
        lPrimaryKey = 1
    End If
    NroQR = lPrimaryKey
    'lPrimaryKey = GetPrimaryKey
    VNro = lPrimaryKey
    'GENERA CAE
    'llena variables
    FVto = Mid(FechaNC, 7, 4) & Mid(FechaNC, 4, 2) & Mid(FechaNC, 1, 2)
    FServD = Mid(FechaNC, 7, 4) & Mid(FechaNC, 4, 2) & Mid(FechaNC, 1, 2)
    FservH = Mid(FechaNC, 7, 4) & Mid(FechaNC, 4, 2) & Mid(FechaNC, 1, 2)
    FPago = Mid(FechaNC, 7, 4) & Mid(FechaNC, 4, 2) & Mid(FechaNC, 1, 2)
    VNetoFE = FormatNumber(TNeto)
    VivaFE = FormatNumber(TIVA)
    FCte = Mid(FechaNC, 7, 4) & Mid(FechaNC, 4, 2) & Mid(FechaNC, 1, 2)
    If Option1(0).Value = True Then
        Set rsEmpresas = db.OpenRecordset("SELECT * FROM Empresas WHERE CodEmpresas = " & Text1(1) & "")
        VCUIT = Mid(rsEmpresas!cuit, 1, 2) & Mid(rsEmpresas!cuit, 4, 8) & Mid(rsEmpresas!cuit, 13, 1)
    Else
         Set rsFleteros = db.OpenRecordset("Select * from Fleteros Where CodFlet = " & Text1(1) & "")
         VCUIT = Mid(rsFleteros!cuit, 1, 2) & Mid(rsFleteros!cuit, 4, 8) & Mid(rsFleteros!cuit, 13, 1)
    End If
    VTipoDoc = 80
    Set rsEncabFact = db.OpenRecordset("EncabFE")
    If rsEncabFact.EOF Then
        VIndice = 0
    Else
        rsEncabFact.MoveLast
        VIndice = rsEncabFact!indice + 1
    End If
    
    With rsEncabFact
        .AddNew
        .Fields("Indice") = VIndice
        .Fields("PtoVtaFE") = 4
        .Fields("NroFE") = lPrimaryKey
        .Fields("FechaFE") = FechaNC
        .Fields("CodClie") = Text1(1)
        .Fields("TotalNetoFE") = VNetoFE
        .Fields("TotalIvaFE") = VivaFE
        .Fields("TotalGralFE") = FormatNumber(TNC)
        .Fields("TipoAfip") = 2
        .Fields("TipoSistema") = VtipoComp
        .Fields("FVto") = FVto
        .Fields("FservD") = FServD
        .Fields("FservH") = FservH
        .Fields("FPago") = FPago
        If Option1(0).Value = True Then
            .Fields("ClaseFact") = 4 'nota de debito a empresa
        Else
            .Fields("ClaseFact") = 5 'nota de debito a fletero
        End If
        .Fields("PtoVta_Asoc") = Text1(9)
        .Fields("Nro_Asoc") = Text1(10)
        If Text1(12) = 60 Then
            .Fields("TipoComp_Asoc") = 60
        ElseIf Text1(12) = 17 Then
            .Fields("TipoComp_Asoc") = 3
        End If
        .Fields("Fecha_Asoc") = Text1(11)
        
        'Call CAE_ND
        '.Fields("CAE") = NDE.F1RespuestaDetalleCae
        '.Fields("VtoCAE") = NDE.F1RespuestaDetalleCAEFchVto
        '.Fields("ObsCAE") = NDE.F1RespuestaDetalleResultado
        '.Fields("MotivoCAE") = NDE.F1RespuestaDetalleObservacionMsg
        'VRuta = App.Path + "\QR\qr" & VTipoComp1 & "_4_" & NroQR & ".jpg"
        '.Fields("qr") = VRuta
        .Update
    End With
    'graba encabezado en temporales
    With TrsEncabFact
        .AddNew
        largo = Len(VNro)
        Select Case largo
            Case 1: NRO = "0000000" & lPrimaryKey
            Case 2: NRO = "000000" & lPrimaryKey
            Case 3: NRO = "00000" & lPrimaryKey
            Case 4: NRO = "0000" & lPrimaryKey
            Case 5: NRO = "000" & lPrimaryKey
            Case 6: NRO = "00" & lPrimaryKey
            Case 7: NRO = "0" & lPrimaryKey
            Case 8: NRO = lPrimaryKey
        End Select
        .Fields("NroFact") = lPrimaryKey
        .Fields("Fecha") = FechaNC
        .Fields("Codigo") = Text1(1)
        Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & Text1(1) & "")
        .Fields("DescClie") = rsEmpresas!DescEmpresas
        .Fields("DirClie") = rsEmpresas!Direccion
        .Fields("LocCLie") = rsEmpresas!Localidad
        .Fields("CuitClie") = rsEmpresas!cuit
        .Fields("TipoFact") = 4 '1 - Factura Viajes, 2- Factura de Comisión
        .Fields("TNeto") = FormatNumber(TNeto)
        .Fields("TIVA") = FormatNumber(TIVA)
        .Fields("TGral") = FormatNumber(TNC)
        .Fields("CAE") = Me.NDE.F1RespuestaDetalleCae
        .Fields("ObsCAE") = NDE.F1RespuestaDetalleResultado
        DIA = Mid(NDE.F1RespuestaDetalleCAEFchVto, 7, 2)
        MES = Mid(NDE.F1RespuestaDetalleCAEFchVto, 5, 2)
        AÑO = Mid(NDE.F1RespuestaDetalleCAEFchVto, 1, 4)
        FVTOCAE = DIA & "/" & MES & "/" & AÑO
        .Fields("VtoCAE") = FVTOCAE
        .Fields("MotivoCAE") = NDE.F1RespuestaDetalleResultado
        .Fields("NroFE") = NRO
        .Fields("PtoVtaFE") = "0004"
        .Fields("qr") = VRuta
        .Update
    End With
    'graba detalle en temporales
    Items = 0
    For Items = Items + 1 To CuerpoNC.ListItems.Count
        Set Cuerpo = CuerpoNC.ListItems.Item(Items)
        With rsDetFact
            .AddNew
            .Fields("NroFact") = lPrimaryKey
            .Fields("ConceptoNC") = Mid(Cuerpo.Tag, 1, 200)
            .Fields("STotal") = Cuerpo.SubItems(2)
            .Fields("TipoComp") = 2
            .Fields("Alicuota") = Cuerpo.SubItems(1)
            .Update
        End With
        With TrsDetFact
            .AddNew
            .Fields("NroFact") = lPrimaryKey
            .Fields("ConceptoNC") = Mid(Cuerpo.Tag, 1, 200)
            .Fields("STotal") = Cuerpo.SubItems(2)
            .Update
        End With
    Next
    'GRABA FACTURA EN CTA CTE
    If Option1(0).Value = True Then
        Set rsCtaCteEmp = db.OpenRecordset("CtaCteEmp")
        With rsCtaCteEmp
            .AddNew
            .Fields("Fecha") = FechaNC
            .Fields("CodEmp") = Text1(1)
            .Fields("PtoVta") = 4
            .Fields("NroComp") = lPrimaryKey
            .Fields("TipoComp") = 18
            .Fields("Debe") = FormatNumber(TNC)
            .Fields("SaldoComp") = FormatNumber(TNC)
            .Update
        End With
    Else
        Set rsCtaCteEmp = db.OpenRecordset("CtaCteProv")
        With rsCtaCteEmp
            .AddNew
            .Fields("Fecha") = FechaNC
            .Fields("CodProv") = Text1(1)
            .Fields("PtoVta") = 4
            .Fields("NroComp") = lPrimaryKey
            .Fields("TipoComp") = 18
            .Fields("Haber") = FormatNumber(TNC)
            .Fields("SaldoComp") = FormatNumber(TNC)
            .Update
        End With
    End If
    Set rsEncabFactCta = Nothing
    Set rsDetFactCta = Nothing
    Set rsCtaCteEmp = Nothing
    'factura grabada correctamente


End Sub

Private Sub AgregarCHP_Click()
If IsNumeric(Text1(4)) = True And IsNumeric(Text1(5)) = True Then
    Set Cuerpo = CuerpoNC.ListItems.Add(, , Text1(3))
    Cuerpo.Tag = Text1(3)
    Cuerpo.SubItems(1) = Text1(4)
    Cuerpo.SubItems(2) = Text1(5)
    TNeto = TNeto + Text1(5)
    TIVA = TIVA + Text1(5) * Text1(4) / 100
    TNC = TNeto + TIVA
    Text1(6) = FormatNumber(TNeto)
    Text1(7) = FormatNumber(TIVA)
    Text1(8) = FormatNumber(TNC)
    Text1(3) = ""
    Text1(4) = ""
    Text1(5) = ""
    Text1(3).SetFocus
Else
    MsgBox "Unos de los campos no es numerico", vbInformation
End If
End Sub

Private Sub Form_Load()
i = 0
For i = i + 1 To Text1.Count
    Text1(i - 1) = ""
Next
Text1(6) = "0.00"
Text1(7) = "0.00"
Text1(8) = "0.00"
FechaNC.Mask = ""
FechaNC.Text = ""
FechaNC.Mask = "##/##/####"
FechaNC = Date
TipoComp.AddItem "Nota de Debito A"
TipoComp.AddItem "Nota de Debito LP"
TipoComp.ListIndex = 0
CuerpoNC.ListItems.Clear
TNeto = 0
TIVA = 0
TNC = 0
Option1(0).Value = True
Option1(1).Value = False
End Sub

Private Sub Text1_Change(Index As Integer)
Select Case Index:
Case 3:
i = 0
i = Len(Text1(3))
If Not i < 250 Then
    MsgBox "El campo debe tener 250 caracteres", vbInformation
    Text1(3) = Mid(Text1(3), 1, 250)
End If
End Select
End Sub

Private Sub Text1_LostFocus(Index As Integer)
Select Case Index
    Case 1:
        If Not Text1(1) = "" Then
            If Option1(0).Value = True Then
                Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & Text1(1) & "")
                If Not rsEmpresas.EOF And Not rsEmpresas.BOF Then
                    Text1(2) = rsEmpresas!DescEmpresas
                Else
                    MsgBox "La empresa no existe", vbInformation
                End If
                Set rsEmpresas = Nothing
            Else
                Set rsFleteros = db.OpenRecordset("Select * from Fleteros Where CodFlet = " & Text1(1) & "")
                If Not rsFleteros.EOF And Not rsFleteros.BOF Then
                    Text1(2) = rsFleteros!DescFlet
                Else
                    MsgBox "El Fletero no existe", vbInformation
                End If
                Set rsFleteros = Nothing
            End If
        End If
    Case 12:
         If Not Text1(12) = "" Then
            If Text1(12) = 60 Or Text1(12) = 17 Then
                Set rsComprobantes = db.OpenRecordset("Select * from Comprobantes Where CodComp = " & Text1(12) & "")
                If Not rsComprobantes.EOF And Not rsComprobantes.BOF Then
                    Text1(13) = rsComprobantes!DescComp
                Else
                    MsgBox "El comprobante no existe"
                End If
            Else
                MsgBox "Comprobante no admitido para asociar"
                Text1(12) = ""
                Text1(13) = ""
                Text1(12).SetFocus
            End If
        End If
    Case 9:
        If Text1(9) = "" Then
            MsgBox "Campo obligatorio"
            Text1(9).SetFocus
        End If
    Case 10:
        If Text1(10) = "" Then
            MsgBox "Campo Obligatorio"
            Text1(10).SetFocus
        Else
            Set rsEncabFact = db.OpenRecordset("Select * from EncabFE Where CodClie = " & Text1(1) & " and PtoVtaFE = " & Text1(9) & " and NroFE = " & Text1(10) & " and TipoSistema = " & Text1(12) & "")
            If rsEncabFact.EOF Then
                MsgBox "El comprobante a aplicar no pertenece al Fletero/Empresa"
                Text1(10) = ""
                Text1(10).SetFocus
            Else
                Text1(11) = rsEncabFact!FechaFE
            End If
        End If
        
End Select

End Sub

